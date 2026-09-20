(() => {

    "use strict";


    // ============================================================
    // PARTICLE STORM
    // ============================================================

    const PARTICLE_COUNT = 3000;


    // ============================================================
    // HTML ELEMENTS
    // ============================================================

    const canvas =
        document.getElementById("scene");

    const video =
        document.getElementById("webcam");

    const loading =
        document.getElementById("loading");

    const loadingText =
        document.getElementById("loadingText");

    const statusText =
        document.getElementById("statusText");

    const statusDot =
        document.getElementById("statusDot");

    const fpsEl =
        document.getElementById("fps");

    const handCountEl =
        document.getElementById("handCount");

    const fingerCountEl =
        document.getElementById("fingerCount");

    const chargeEl =
        document.getElementById("charge");

    const chargeFill =
        document.getElementById("chargeFill");


    // ============================================================
    // THREE.JS
    // ============================================================

    if (!window.THREE) {

        throw new Error(
            "Three.js failed to load."
        );

    }


    const scene =
        new THREE.Scene();


    const camera =
        new THREE.PerspectiveCamera(
            55,
            window.innerWidth /
            window.innerHeight,
            0.1,
            100
        );


    camera.position.z = 6.5;


    const renderer =
        new THREE.WebGLRenderer({

            canvas: canvas,

            antialias: true,

            alpha: true

        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.setClearColor(
        0x000000,
        1
    );


    // ============================================================
    // PARTICLE ARRAYS
    // ============================================================

    const positions =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const targets =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const velocities =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const colors =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const randoms =
        new Float32Array(
            PARTICLE_COUNT
        );


    // ============================================================
    // CREATE 3000 PARTICLES
    // ============================================================

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {

        const j = i * 3;


        // Uniform distribution on sphere

        const u =
            Math.random() * 2 - 1;


        const theta =
            Math.random() *
            Math.PI * 2;


        const s =
            Math.sqrt(
                1 - u * u
            );


        const radius =
            1.55 +
            Math.random() * 0.28;


        const x =
            s *
            Math.cos(theta) *
            radius;


        const y =
            u * radius;


        const z =
            s *
            Math.sin(theta) *
            radius;


        positions[j] =
            x;

        positions[j + 1] =
            y;

        positions[j + 2] =
            z;


        targets[j] =
            x;

        targets[j + 1] =
            y;

        targets[j + 2] =
            z;


        velocities[j] =
            0;

        velocities[j + 1] =
            0;

        velocities[j + 2] =
            0;


        colors[j] =
            1;

        colors[j + 1] =
            1;

        colors[j + 2] =
            1;


        randoms[i] =
            Math.random();

    }


    // ============================================================
    // GEOMETRY
    // ============================================================

    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.BufferAttribute(
            positions,
            3
        )

    );


    geometry.setAttribute(

        "color",

        new THREE.BufferAttribute(
            colors,
            3
        )

    );


    // ============================================================
    // MATERIAL
    // ============================================================

    const material =
        new THREE.PointsMaterial({

            size: 0.035,

            vertexColors: true,

            transparent: true,

            opacity: 0.95,

            blending:
                THREE.AdditiveBlending,

            depthWrite: false

        });


    // ============================================================
    // PARTICLE CLOUD
    // ============================================================

    const particleCloud =
        new THREE.Points(
            geometry,
            material
        );


    scene.add(
        particleCloud
    );


    // ============================================================
    // VARIABLES
    // ============================================================

    let handX = 0;

    let handY = 0;

    let smoothX = 0;

    let smoothY = 0;


    let targetScale = 1;

    let scale = 1;


    let currentFingerCount = -1;


    let pinch = false;

    let wasPinching = false;


    let charge = 0;


    let exploding = false;

    let explosionTime = 0;


    // ============================================================
    // DISTANCE
    // ============================================================

    function distance(a, b) {

        const dx =
            a.x - b.x;

        const dy =
            a.y - b.y;


        return Math.sqrt(
            dx * dx +
            dy * dy
        );

    }


    // ============================================================
    // STATUS
    // ============================================================

    function setStatus(
        text,
        active = true
    ) {

        statusText.textContent =
            text;


        statusDot.style.opacity =
            active ? "1" : "0.4";

    }


    // ============================================================
    // FINGER COUNTING
    // ============================================================

    function countFingers(
        landmarks
    ) {

        let count = 0;


        // Thumb

        if (
            landmarks[4].x <
            landmarks[3].x
        ) {

            count++;

        }


        // Index

        if (
            landmarks[8].y <
            landmarks[6].y
        ) {

            count++;

        }


        // Middle

        if (
            landmarks[12].y <
            landmarks[10].y
        ) {

            count++;

        }


        // Ring

        if (
            landmarks[16].y <
            landmarks[14].y
        ) {

            count++;

        }


        // Pinky

        if (
            landmarks[20].y <
            landmarks[18].y
        ) {

            count++;

        }


        return count;

    }


    // ============================================================
    // PARTICLE COLOURS
    // ============================================================

    function applyFingerColorMode(
        count
    ) {

        if (
            count ===
            currentFingerCount
        ) {

            return;

        }


        currentFingerCount =
            count;


        fingerCountEl.textContent =
            String(count);


        const temp =
            new THREE.Color();


        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {

            const j = i * 3;


            let r = 1;

            let g = 1;

            let b = 1;


            // 0 fingers = WHITE

            if (count === 0) {

                r = 1;
                g = 1;
                b = 1;

            }


            // 1 finger = RED

            else if (count === 1) {

                r = 1;
                g = 0.03;
                b = 0.03;

            }


            // 2 fingers = BLUE

            else if (count === 2) {

                r = 0.03;
                g = 0.3;
                b = 1;

            }


            // 3 fingers = GREEN

            else if (count === 3) {

                r = 0.03;
                g = 1;
                b = 0.2;

            }


            // 4 fingers = PURPLE

            else if (count === 4) {

                r = 0.7;
                g = 0.08;
                b = 1;

            }


            // 5 fingers = RAINBOW

            else {

                temp.setHSL(

                    (
                        i /
                        PARTICLE_COUNT +

                        performance.now() *
                        0.00002

                    ) % 1,

                    1,

                    0.55

                );


                r = temp.r;

                g = temp.g;

                b = temp.b;

            }


            colors[j] =
                r;

            colors[j + 1] =
                g;

            colors[j + 2] =
                b;

        }


        geometry
            .attributes
            .color
            .needsUpdate = true;

    }


    // ============================================================
    // EXPLOSION
    // ============================================================

    function startExplosion() {

        if (exploding) {

            return;

        }


        exploding = true;

        explosionTime = 0;


        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {

            const j = i * 3;


            const x =
                positions[j];

            const y =
                positions[j + 1];

            const z =
                positions[j + 2];


            const length =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                ) || 1;


            const force =
                0.045 +
                Math.random() * 0.12;


            velocities[j] =
                (x / length) *
                force;


            velocities[j + 1] =
                (y / length) *
                force;


            velocities[j + 2] =
                (z / length) *
                force;

        }

    }


    // ============================================================
    // MEDIAPIPE
    // ============================================================

    if (!window.Hands) {

        loadingText.textContent =
            "MEDIAPIPE FAILED TO LOAD";


        throw new Error(
            "MediaPipe Hands failed to load."
        );

    }


    const hands =
        new Hands({

            locateFile: function(file) {

                return (
                    "https://cdn.jsdelivr.net/npm/" +
                    "@mediapipe/hands@0.4.1675469240/" +
                    file
                );

            }

        });


    hands.setOptions({

        maxNumHands: 2,

        modelComplexity: 1,

        minDetectionConfidence: 0.6,

        minTrackingConfidence: 0.6

    });


    // ============================================================
    // MEDIAPIPE RESULTS
    // ============================================================

    hands.onResults(

        function(results) {

            const allHands =
                results.multiHandLandmarks ||
                [];


            handCountEl.textContent =
                String(
                    allHands.length
                );


            // No hand

            if (
                allHands.length === 0
            ) {

                setStatus(
                    "SHOW YOUR HAND",
                    false
                );


                targetScale = 1;


                pinch = false;


                charge =
                    Math.max(
                        0,
                        charge - 0.05
                    );


                chargeFill.style.width =
                    `${charge * 100}%`;


                if (charge <= 0) {

                    chargeEl.style.opacity =
                        "0";

                }


                return;

            }


            // Hand detected

            setStatus(

                allHands.length === 2
                    ? "TWO HANDS DETECTED"
                    : "HAND TRACKING",

                true

            );


            const hand =
                allHands[0];


            const palm =
                hand[9];


            // Hand movement

            handX =
                (palm.x - 0.5) *
                2;


            handY =
                -(palm.y - 0.5) *
                2;


            // Finger count

            const fingers =
                countFingers(hand);


            applyFingerColorMode(
                fingers
            );


            // ====================================================
            // PINCH
            // ====================================================

            const pinchDistance =
                distance(
                    hand[4],
                    hand[8]
                );


            pinch =
                pinchDistance <
                0.065;


            if (pinch) {

                charge =
                    Math.min(
                        1,
                        charge + 0.018
                    );


                chargeEl.style.opacity =
                    "1";


                chargeFill.style.width =
                    `${charge * 100}%`;

            }


            else {

                if (
                    wasPinching &&
                    charge >= 0.55
                ) {

                    startExplosion();

                }


                charge =
                    Math.max(
                        0,
                        charge - 0.06
                    );


                chargeFill.style.width =
                    `${charge * 100}%`;


                if (charge <= 0) {

                    chargeEl.style.opacity =
                        "0";

                }

            }


            wasPinching =
                pinch;


            // ====================================================
            // TWO HAND SCALE
            // ====================================================

            if (
                allHands.length === 2
            ) {

                const d =
                    distance(

                        allHands[0][9],

                        allHands[1][9]

                    );


                targetScale =
                    THREE.MathUtils.clamp(

                        d * 3.2,

                        0.65,

                        2.1

                    );

            }

            else {

                targetScale = 1;

            }

        }

    );


    // ============================================================
    // CAMERA
    // ============================================================

    async function startCamera() {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            setStatus(
                "CAMERA API UNAVAILABLE",
                false
            );


            loadingText.textContent =
                "USE LIVE SERVER / HTTPS";


            return;

        }


        try {

            setStatus(
                "REQUESTING CAMERA",
                false
            );


            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video: {

                            width: {
                                ideal: 640
                            },

                            height: {
                                ideal: 480
                            },

                            facingMode:
                                "user"

                        },

                        audio: false

                    });


            video.srcObject =
                stream;


            await video.play();


            setStatus(
                "HAND TRACKING READY",
                true
            );


            loading.style.opacity =
                "0";


            setTimeout(

                function() {

                    loading.style.display =
                        "none";

                },

                550

            );


            // Prevent overlapping
            // MediaPipe requests.

            let busy = false;


            async function process() {

                if (
                    !busy &&
                    video.readyState >= 2
                ) {

                    busy = true;


                    try {

                        await hands.send({

                            image: video

                        });

                    }


                    catch (error) {

                        console.error(
                            "MediaPipe frame error:",
                            error
                        );

                    }


                    finally {

                        busy = false;

                    }

                }


                requestAnimationFrame(
                    process
                );

            }


            process();

        }


        catch (error) {

            console.error(
                "Camera error:",
                error
            );


            setStatus(
                "CAMERA ACCESS DENIED",
                false
            );


            loadingText.textContent =
                "ALLOW CAMERA ACCESS AND RELOAD";

        }

    }


    // ============================================================
    // PARTICLE ANIMATION
    // ============================================================

    function updateParticles(time) {

        // Smooth hand movement

        smoothX +=
            (
                handX -
                smoothX
            ) * 0.075;


        smoothY +=
            (
                handY -
                smoothY
            ) * 0.075;


        // Smooth scaling

        scale +=
            (
                targetScale -
                scale
            ) * 0.07;


        particleCloud.scale.setScalar(
            scale
        );


        // Rotation

        particleCloud.rotation.y +=

            (
                smoothX * 1.4 -
                particleCloud.rotation.y
            ) * 0.035;


        particleCloud.rotation.x +=

            (
                smoothY * 0.9 -
                particleCloud.rotation.x
            ) * 0.035;


        // ========================================================
        // PARTICLE MOVEMENT
        // ========================================================

        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {

            const j = i * 3;


            // EXPLOSION

            if (exploding) {

                positions[j] +=
                    velocities[j];


                positions[j + 1] +=
                    velocities[j + 1];


                positions[j + 2] +=
                    velocities[j + 2];


                velocities[j] *=
                    0.965;


                velocities[j + 1] *=
                    0.965;


                velocities[j + 2] *=
                    0.965;


                // Return to sphere

                positions[j] +=

                    (
                        targets[j] -
                        positions[j]
                    ) * 0.012;


                positions[j + 1] +=

                    (
                        targets[j + 1] -
                        positions[j + 1]
                    ) * 0.012;


                positions[j + 2] +=

                    (
                        targets[j + 2] -
                        positions[j + 2]
                    ) * 0.012;

            }


            // NORMAL STATE

            else {

                const wobble =

                    Math.sin(

                        time * 0.0015 +

                        randoms[i] * 10

                    ) * 0.012;


                positions[j] +=

                    (
                        targets[j] +
                        wobble -
                        positions[j]
                    ) * 0.08;


                positions[j + 1] +=

                    (
                        targets[j + 1] +
                        wobble -
                        positions[j + 1]
                    ) * 0.08;


                positions[j + 2] +=

                    (
                        targets[j + 2] +
                        wobble -
                        positions[j + 2]
                    ) * 0.08;

            }

        }


        // ========================================================
        // END EXPLOSION
        // ========================================================

        if (exploding) {

            explosionTime++;


            if (
                explosionTime > 150
            ) {

                exploding = false;


                for (
                    let i = 0;
                    i < PARTICLE_COUNT;
                    i++
                ) {

                    const j = i * 3;


                    positions[j] =
                        targets[j];


                    positions[j + 1] =
                        targets[j + 1];


                    positions[j + 2] =
                        targets[j + 2];


                    velocities[j] =
                        0;


                    velocities[j + 1] =
                        0;


                    velocities[j + 2] =
                        0;

                }

            }

        }


        geometry
            .attributes
            .position
            .needsUpdate = true;

    }


    // ============================================================
    // FPS
    // ============================================================

    let frameCounter = 0;

    let fpsTimer =
        performance.now();


    // ============================================================
    // RENDER LOOP
    // ============================================================

    function animate(time) {

        requestAnimationFrame(
            animate
        );


        updateParticles(
            time
        );


        renderer.render(
            scene,
            camera
        );


        frameCounter++;


        if (
            time -
            fpsTimer >=
            1000
        ) {

            fpsEl.textContent =
                String(
                    frameCounter
                );


            frameCounter = 0;


            fpsTimer =
                time;

        }

    }


    // ============================================================
    // WINDOW RESIZE
    // ============================================================

    window.addEventListener(

        "resize",

        function() {

            camera.aspect =
                window.innerWidth /
                window.innerHeight;


            camera.updateProjectionMatrix();


            renderer.setSize(

                window.innerWidth,

                window.innerHeight

            );

        }

    );


    // ============================================================
    // START
    // ============================================================

    animate(0);

    startCamera();


})();