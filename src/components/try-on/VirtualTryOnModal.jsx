import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS = {
  IDLE: 'Chưa bật camera',
  LOADING_MODEL: 'Đang khởi tạo thử kính',
  DETECTING: 'Đang nhận diện khuôn mặt',
  NO_FACE: 'Không tìm thấy khuôn mặt',
};

const GLASSES_FIT = {
  widthMultiplier: 1.55,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  eyeCenterLiftRatio: 0,
  headTurnFollowRatio: 0,
  headYawStrength: 1,
  maxHeadYaw: 0.24,
  headPitchStrength: 0.65,
  maxHeadPitch: 0.35,
  rotationX: -1,
  rotationY: -1.5,
  rotationZ: 0,
  smoothing: 0.85,
};

const LANDMARKS = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  leftEyeTop: 159,
  leftEyeBottom: 145,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  rightEyeTop: 386,
  rightEyeBottom: 374,
  noseTip: 1,
};

const resolveAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const value = path.trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) {
    return value;
  }

  const base = API_BASE_URL.replace(/\/$/, '');
  if (value.startsWith('/uploads/')) return `${base}${value}`;
  if (value.startsWith('uploads/')) return `${base}/${value}`;
  return `${base}/uploads/${value.replace(/^\/+/, '')}`;
};

const getSelectedVariant = (glasses) => {
  if (glasses?.selectedVariant) return glasses.selectedVariant;
  return Array.isArray(glasses?.variants) ? glasses.variants[0] : null;
};

const getTryOnModelPath = (glasses) => {
  const selectedVariant = getSelectedVariant(glasses);
  const firstModelVariant = Array.isArray(glasses?.variants)
    ? glasses.variants.find((variant) =>
        variant?.tryOnModelUrl ||
        variant?.image3d ||
        variant?.modelUrl
      )
    : null;

  return (
    selectedVariant?.tryOnModelUrl ||
    selectedVariant?.image3d ||
    selectedVariant?.modelUrl ||
    glasses?.tryOnModelUrl ||
    glasses?.image3d ||
    glasses?.modelUrl ||
    firstModelVariant?.tryOnModelUrl ||
    firstModelVariant?.image3d ||
    firstModelVariant?.modelUrl ||
    ''
  );
};

const createEmptyPose = () => ({
  initialized: false,
  position: new THREE.Vector3(),
  scale: 1,
  quaternion: new THREE.Quaternion(),
});

const averageLandmarks = (points) => {
  const validPoints = points.filter(Boolean);
  if (!validPoints.length) return null;

  const sum = validPoints.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + (point.z || 0),
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: sum.x / validPoints.length,
    y: sum.y / validPoints.length,
    z: sum.z / validPoints.length,
  };
};

const waitForVideo = (video) => {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const stopStream = (stream) => {
  stream.getTracks().forEach((track) => track.stop());
};

const VirtualTryOnModal = ({ isOpen, glasses, onClose }) => {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const streamRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const glassesRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const modelBaseWidthRef = useRef(1);
  const smoothedPoseRef = useRef(createEmptyPose());
  const neutralPitchRatioRef = useRef(null);
  const runningRef = useRef(false);
  const startingRef = useRef(false);
  const statusRef = useRef(STATUS.IDLE);
  const startTokenRef = useRef(0);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoRatio, setVideoRatio] = useState('16 / 9');

  const modelUrl = useMemo(
    () => resolveAssetUrl(getTryOnModelPath(glasses)),
    [glasses],
  );

  const setStatusOnce = useCallback((nextStatus) => {
    if (statusRef.current === nextStatus) return;
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const cleanupThree = useCallback(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;

    if (scene) {
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    }

    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }

    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    glassesRef.current = null;
    modelBaseWidthRef.current = 1;
    smoothedPoseRef.current = createEmptyPose();
    neutralPitchRatioRef.current = null;
  }, []);

  const hardCleanup = useCallback(() => {
    runningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
      faceLandmarkerRef.current = null;
    }

    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    cleanupThree();
    setIsCameraOn(false);
    startingRef.current = false;
  }, [cleanupThree]);

  const resizeRenderer = useCallback(() => {
    const stage = stageRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!stage || !renderer || !camera) return;

    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  }, []);

  const initThreeScene = useCallback(() => {
    cleanupThree();

    const stage = stageRef.current;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.01,
      5000,
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      transform: 'scaleX(-1)',
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 1, 2);
    scene.add(ambientLight, directionalLight);

    stage.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    resizeRenderer();
  }, [cleanupThree, resizeRenderer]);

  const createFaceLandmarker = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    try {
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch (gpuError) {
      console.warn('GPU delegate failed, using CPU.', gpuError);
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    }
  }, []);

  const removeDecorativeMeshes = (model) => {
    const removable = [];

    model.traverse((child) => {
      if (!child.isMesh) return;
      if (/text/i.test(child.name)) {
        removable.push(child);
      }
    });

    removable.forEach((child) => {
      child.parent?.remove(child);
    });
  };

  const getFrontFrameBox = (root) => {
    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();

    root.updateMatrixWorld(true);
    root.traverse((child) => {
      if (!child.isMesh || /dushka|text/i.test(child.name)) return;
      meshBox.setFromObject(child);
      box.union(meshBox);
    });

    if (box.isEmpty()) {
      box.setFromObject(root);
    }

    return box;
  };

  const loadGlassesModel = useCallback(async (scene) => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl);
    const model = gltf.scene;

    removeDecorativeMeshes(model);

    const orientedModel = new THREE.Group();
    const axisFixMatrix = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 0, 0),
    );
    orientedModel.applyMatrix4(axisFixMatrix);
    orientedModel.add(model);
    orientedModel.updateMatrixWorld(true);

    const box = getFrontFrameBox(orientedModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    orientedModel.position.sub(center);

    const pivot = new THREE.Group();
    pivot.name = 'VirtualGlasses';
    pivot.visible = false;
    pivot.add(orientedModel);

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.frustumCulled = false;
      child.renderOrder = 10;
    });

    modelBaseWidthRef.current = Math.max(size.x, 0.001);
    glassesRef.current = pivot;
    scene.add(pivot);
  }, [modelUrl]);

  const hideGlasses = useCallback(() => {
    if (glassesRef.current) {
      glassesRef.current.visible = false;
    }

    smoothedPoseRef.current.initialized = false;
    neutralPitchRatioRef.current = null;
  }, []);

  const landmarkToScenePoint = useCallback((landmark) => {
    const stage = stageRef.current;
    const width = Math.max(stage?.clientWidth || 1, 1);
    const height = Math.max(stage?.clientHeight || 1, 1);

    return new THREE.Vector3(
      (landmark.x - 0.5) * width,
      (0.5 - landmark.y) * height,
      -(landmark.z || 0) * width,
    );
  }, []);

  const getHeadQuaternion = useCallback((
    leftEyePoint,
    rightEyePoint,
    noseTipPoint,
    eyeMidPoint,
    eyeDistance,
  ) => {
    const eyeVector = rightEyePoint.clone().sub(leftEyePoint);

    if (eyeVector.lengthSq() < 0.0001) {
      return new THREE.Quaternion();
    }

    const roll = Math.atan2(eyeVector.y, eyeVector.x);
    const yaw = THREE.MathUtils.clamp(
      -((noseTipPoint.x - eyeMidPoint.x) / eyeDistance) * GLASSES_FIT.headYawStrength,
      -GLASSES_FIT.maxHeadYaw,
      GLASSES_FIT.maxHeadYaw,
    );
    const noseToEyeRatio = (noseTipPoint.y - eyeMidPoint.y) / eyeDistance;

    if (neutralPitchRatioRef.current === null) {
      neutralPitchRatioRef.current = noseToEyeRatio;
    }

    const pitch = THREE.MathUtils.clamp(
      (noseToEyeRatio - neutralPitchRatioRef.current) * GLASSES_FIT.headPitchStrength,
      -GLASSES_FIT.maxHeadPitch,
      GLASSES_FIT.maxHeadPitch,
    );

    return new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'XYZ'));
  }, []);

  const applyFixedRotationOffset = (quaternion) => {
    const offset = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(GLASSES_FIT.rotationX),
        THREE.MathUtils.degToRad(GLASSES_FIT.rotationY),
        THREE.MathUtils.degToRad(GLASSES_FIT.rotationZ),
        'XYZ',
      ),
    );

    quaternion.multiply(offset);
  };

  const applySmoothedPose = (glassesObject, position, scale, quaternion) => {
    const pose = smoothedPoseRef.current;

    if (!pose.initialized) {
      pose.position.copy(position);
      pose.scale = scale;
      pose.quaternion.copy(quaternion);
      pose.initialized = true;
    } else {
      const alpha = GLASSES_FIT.smoothing;
      pose.position.lerp(position, alpha);
      pose.scale = THREE.MathUtils.lerp(pose.scale, scale, alpha);
      pose.quaternion.slerp(quaternion, alpha);
    }

    glassesObject.position.copy(pose.position);
    glassesObject.scale.setScalar(pose.scale);
    glassesObject.quaternion.copy(pose.quaternion);
  };

  const updateGlassesFromLandmarks = useCallback((landmarks) => {
    const glassesObject = glassesRef.current;
    if (!glassesObject) return;

    const leftEye = averageLandmarks([
      landmarks[LANDMARKS.leftEyeOuter],
      landmarks[LANDMARKS.leftEyeInner],
      landmarks[LANDMARKS.leftEyeTop],
      landmarks[LANDMARKS.leftEyeBottom],
    ]);
    const rightEye = averageLandmarks([
      landmarks[LANDMARKS.rightEyeOuter],
      landmarks[LANDMARKS.rightEyeInner],
      landmarks[LANDMARKS.rightEyeTop],
      landmarks[LANDMARKS.rightEyeBottom],
    ]);
    const leftOuter = landmarks[LANDMARKS.leftEyeOuter];
    const rightOuter = landmarks[LANDMARKS.rightEyeOuter];
    const noseTip = landmarks[LANDMARKS.noseTip];

    if (!leftEye || !rightEye || !leftOuter || !rightOuter || !noseTip) {
      hideGlasses();
      return;
    }

    const leftEyePoint = landmarkToScenePoint(leftEye);
    const rightEyePoint = landmarkToScenePoint(rightEye);
    const leftOuterPoint = landmarkToScenePoint(leftOuter);
    const rightOuterPoint = landmarkToScenePoint(rightOuter);
    const noseTipPoint = landmarkToScenePoint(noseTip);
    const eyeMidPoint = leftEyePoint.clone().add(rightEyePoint).multiplyScalar(0.5);
    const eyeDistance = leftEyePoint.distanceTo(rightEyePoint);
    const outerEyeDistance = leftOuterPoint.distanceTo(rightOuterPoint);

    if (!Number.isFinite(eyeDistance) || eyeDistance < 5) {
      hideGlasses();
      return;
    }

    const leftOnScreen =
      leftEyePoint.x < rightEyePoint.x ? leftEyePoint : rightEyePoint;
    const rightOnScreen =
      leftEyePoint.x < rightEyePoint.x ? rightEyePoint : leftEyePoint;
    const targetQuaternion = getHeadQuaternion(
      leftOnScreen,
      rightOnScreen,
      noseTipPoint,
      eyeMidPoint,
      eyeDistance,
    );
    const targetScale =
      (outerEyeDistance * GLASSES_FIT.widthMultiplier) / modelBaseWidthRef.current;

    const headTurnOffsetX =
      (noseTipPoint.x - eyeMidPoint.x) * GLASSES_FIT.headTurnFollowRatio;
    const targetPosition = new THREE.Vector3(
      eyeMidPoint.x + headTurnOffsetX + GLASSES_FIT.offsetX,
      eyeMidPoint.y + eyeDistance * GLASSES_FIT.eyeCenterLiftRatio + GLASSES_FIT.offsetY,
      GLASSES_FIT.offsetZ,
    );

    applyFixedRotationOffset(targetQuaternion);
    applySmoothedPose(glassesObject, targetPosition, targetScale, targetQuaternion);
    glassesObject.visible = true;
  }, [getHeadQuaternion, hideGlasses, landmarkToScenePoint]);

  const detectLoop = useCallback(function loop() {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && faceLandmarker) {
      const result = faceLandmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];

      if (landmarks) {
        updateGlassesFromLandmarks(landmarks);
        setStatusOnce(STATUS.DETECTING);
      } else {
        hideGlasses();
        setStatusOnce(STATUS.NO_FACE);
      }
    }

    renderer?.render(scene, camera);
    animationFrameRef.current = requestAnimationFrame(() => {
      loop();
    });
  }, [hideGlasses, setStatusOnce, updateGlassesFromLandmarks]);

  const startCamera = useCallback(async () => {
    if (runningRef.current || startingRef.current) return;

    if (!modelUrl) {
      setError('Sản phẩm này chưa có ảnh thử kính');
      setStatusOnce(STATUS.IDLE);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ camera.');
      setStatusOnce(STATUS.IDLE);
      return;
    }

    const startToken = startTokenRef.current + 1;
    startTokenRef.current = startToken;
    startingRef.current = true;
    setError('');
    setIsStarting(true);
    setStatusOnce(STATUS.LOADING_MODEL);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (startTokenRef.current !== startToken) {
        stopStream(stream);
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await waitForVideo(video);
      await video.play();

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      setVideoRatio(`${width} / ${height}`);

      await nextFrame();
      initThreeScene();

      const scene = sceneRef.current;
      const [faceLandmarker] = await Promise.all([
        createFaceLandmarker(),
        loadGlassesModel(scene),
      ]);

      if (startTokenRef.current !== startToken) {
        faceLandmarker.close();
        return;
      }

      faceLandmarkerRef.current = faceLandmarker;
      runningRef.current = true;
      setIsCameraOn(true);
      setStatusOnce(STATUS.NO_FACE);
      detectLoop();
    } catch (err) {
      console.error(err);
      hardCleanup();
      setError('Không thể mở camera hoặc tải model thử kính.');
      setStatusOnce(STATUS.IDLE);
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, [
    createFaceLandmarker,
    detectLoop,
    hardCleanup,
    initThreeScene,
    loadGlassesModel,
    modelUrl,
    setStatusOnce,
  ]);

  const handleClose = () => {
    startTokenRef.current += 1;
    hardCleanup();
    setError('');
    startingRef.current = false;
    setIsStarting(false);
    setStatusOnce(STATUS.IDLE);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    window.addEventListener('resize', resizeRenderer);
    const startFrame = requestAnimationFrame(() => {
      startCamera();
    });

    return () => {
      cancelAnimationFrame(startFrame);
      window.removeEventListener('resize', resizeRenderer);
      startTokenRef.current += 1;
      hardCleanup();
    };
  }, [hardCleanup, isOpen, resizeRenderer, startCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-sm md:p-lg">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-md py-sm">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Thử kính ảo
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {glasses?.product_name || 'Sản phẩm'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
            aria-label="Đóng thử kính"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-md">
          <div
            ref={stageRef}
            className="relative mx-auto w-full overflow-hidden rounded-lg bg-black"
            style={{ aspectRatio: videoRatio }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
              muted
              playsInline
            />

            {!isCameraOn && !isStarting && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                {STATUS.IDLE}
              </div>
            )}

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm bg-black/55 text-white">
                <span className="material-symbols-outlined animate-spin text-[40px]">
                  progress_activity
                </span>
                <span className="font-body-md text-body-md">{status}</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/65 p-md">
                <div className="max-w-md rounded-lg border border-error/40 bg-error-container px-md py-sm text-center text-on-error-container">
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="mt-sm flex items-center justify-between gap-sm text-on-surface-variant">
            <span className="font-body-sm text-body-sm">{status}</span>
            <button
              type="button"
              onClick={() => {
                startTokenRef.current += 1;
                hardCleanup();
                setStatusOnce(STATUS.IDLE);
                startCamera();
              }}
              disabled={isStarting}
              className="rounded-lg border border-outline-variant px-sm py-xs font-label-md text-label-md hover:bg-surface-container disabled:opacity-50"
            >
              Khởi động lại camera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOnModal;
