import React, { useEffect, useRef, useState, useCallback } from "react";

// PUBLIC_INTERFACE
/**
 * Main PinballMaster component for Pinball Master game.
 * Provides the playfield, flippers, score, ball physics, bumpers, and sound effects.
 * Inspired by 3D Pinball Space Cadet. All in-browser logic (no backend).
 */
function PinballMaster() {
  // Score state
  const [score, setScore] = useState(0);
  // Game state (could be expanded for multiball, paused, etc.)
  const [gameOver, setGameOver] = useState(false);
  // Flipper pressed states (for highlight visuals)
  const [leftFlipperDown, setLeftFlipperDown] = useState(false);
  const [rightFlipperDown, setRightFlipperDown] = useState(false);

  // References
  const canvasRef = useRef();
  const animationRef = useRef(null);
  // For managing audio elements/effects
  const audioRefs = useRef({
    flipper: null,
    bumper: null,
    score: null,
  });

  // Table layout constants (responsive layout)
  const TABLE_WIDTH = 400;
  const TABLE_HEIGHT = 700;
  // Colors (theme)
  const COLOR_BG = "#1a1a2e";
  const COLOR_SECONDARY = "#e94560";
  const COLOR_ACCENT = "#0f3460";
  const COLOR_BALL = "#fafaff";
  const COLOR_FLIPPER = "#e94560";
  const COLOR_BUMPER = "#0f3460";
  const COLOR_BUMPER_RING = "#e94560";
  const COLOR_TEXT = "#fff";
  const FLIPPER_LENGTH = 80;
  const FLIPPER_WIDTH = 18;

  // Ball physics and playfield objects
  const initialBall = {
    x: TABLE_WIDTH / 2,
    y: TABLE_HEIGHT / 2,
    vx: 0,
    vy: -4, // Start with gentle upward movement
    radius: 13,
    rolling: true,
  };
  // Bumpers (stationary targets)
  const bumpers = [
    { x: 200, y: 180, radius: 26, score: 100 },
    { x: 100, y: 320, radius: 18, score: 150 },
    { x: 300, y: 320, radius: 18, score: 150 },
    { x: 90,  y: 210, radius: 14, score: 200 },
    { x: 310, y: 210, radius: 14, score: 200 },
    // Center upper bumper
    { x: 200, y: 90, radius: 16, score: 250 },
  ];
  // Targets (simple line targets for extra points)
  const targets = [
    { x1: 60, x2: 120, y: 120, score: 300, hit: false },
    { x1: 280, x2: 340, y: 120, score: 300, hit: false },
    { x1: 140, x2: 260, y: 58, score: 500, hit: false },
  ];

  // Ball, flipper, and other field state refs (so animationFrame can mutate)
  const ballRef = useRef({ ...initialBall });
  const leftFlipperRef = useRef({
    x: 110,
    y: TABLE_HEIGHT - 60,
    angle: -28,
    defAngle: -28,
    maxAngle: 36,
    isDown: false,
    upVel: 0,
  });
  const rightFlipperRef = useRef({
    x: 290,
    y: TABLE_HEIGHT - 60,
    angle: 208, // 180 + 28
    defAngle: 208,
    maxAngle: 144, // 180 + 36
    isDown: false,
    upVel: 0,
  });

  // Sound effect files (short public domain synth SFX)
  const SFX_FLIPPER =
    "https://cdn.pixabay.com/audio/2022/03/15/audio_119b52e5f0.mp3";
  const SFX_BUMPER =
    "https://cdn.pixabay.com/audio/2022/03/15/audio_11e8d7c578.mp3";
  const SFX_SCORE =
    "https://cdn.pixabay.com/audio/2022/03/15/audio_128b503486.mp3";

  // Helpers: Sound effect simple function
  const playSound = (key) => {
    const audio = audioRefs.current[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.play();
    }
  };

  // Ball reset to starting position
  const resetBall = useCallback(() => {
    ballRef.current = { ...initialBall };
    setGameOver(false);
  }, []);

  // Flipper control handlers
  const handleKeyDown = useCallback(
    (e) => {
      if (e.repeat) return;
      if (e.code === "ArrowLeft") {
        setLeftFlipperDown(true);
        leftFlipperRef.current.isDown = true;
        playSound("flipper");
      }
      if (e.code === "ArrowRight") {
        setRightFlipperDown(true);
        rightFlipperRef.current.isDown = true;
        playSound("flipper");
      }
      // Quick restart by space if game over
      if (e.code === "Space" && gameOver) {
        setScore(0);
        resetBall();
      }
    },
    [gameOver, resetBall]
  );

  const handleKeyUp = useCallback((e) => {
    if (e.code === "ArrowLeft") {
      setLeftFlipperDown(false);
      leftFlipperRef.current.isDown = false;
    }
    if (e.code === "ArrowRight") {
      setRightFlipperDown(false);
      rightFlipperRef.current.isDown = false;
    }
  }, []);

  // Touch input handlers for mobile
  const handleTouchStart = (e) => {
    if (!e.touches) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touchX = e.touches[i].clientX;
      const viewportWidth = window.innerWidth;
      if (touchX < viewportWidth / 2) {
        setLeftFlipperDown(true);
        leftFlipperRef.current.isDown = true;
        playSound("flipper");
      } else {
        setRightFlipperDown(true);
        rightFlipperRef.current.isDown = true;
        playSound("flipper");
      }
    }
  };
  const handleTouchEnd = (e) => {
    setLeftFlipperDown(false);
    leftFlipperRef.current.isDown = false;
    setRightFlipperDown(false);
    rightFlipperRef.current.isDown = false;
  };

  // Simple "physics" update
  const update = () => {
    const ctx = canvasRef.current.getContext("2d");
    // Use detached object for animation
    let ball = ballRef.current;

    // Ball gravity
    if (ball.rolling) {
      ball.vy += 0.17; // gravity
      // Dampen horizontal
      ball.vx *= 0.995;
      // Clamp velocity for playability
      ball.vx = Math.max(Math.min(ball.vx, 8), -8);
      ball.vy = Math.max(Math.min(ball.vy, 16), -16);

      // Wall collisions
      // Left and right walls
      if (ball.x - ball.radius < 14 && ball.vx < 0) {
        ball.x = 14 + ball.radius;
        ball.vx *= -0.8;
      }
      if (ball.x + ball.radius > TABLE_WIDTH - 14 && ball.vx > 0) {
        ball.x = TABLE_WIDTH - 14 - ball.radius;
        ball.vx *= -0.8;
      }
      // Top wall
      if (ball.y - ball.radius < 15 && ball.vy < 0) {
        ball.y = 15 + ball.radius;
        ball.vy *= -0.82;
      }

      // Flipper collision (naive rectangle & angle-based)
      ["left", "right"].forEach((side) => {
        const flipper =
          side === "left" ? leftFlipperRef.current : rightFlipperRef.current;
        // Compute flipper tip/hinge points
        const angleRad = ((flipper.angle - 90) * Math.PI) / 180; // adjust
        const hx = flipper.x;
        const hy = flipper.y;
        const tx = hx + Math.cos(angleRad) * FLIPPER_LENGTH;
        const ty = hy + Math.sin(angleRad) * FLIPPER_LENGTH;
        // Closest point on flipper to ball center
        // Project ball onto flipper line segment
        const dx = tx - hx;
        const dy = ty - hy;
        const l2 = dx * dx + dy * dy;
        let t =
          ((ball.x - hx) * dx + (ball.y - hy) * dy) / (l2 === 0 ? 1 : l2);
        t = Math.max(0, Math.min(1, t));
        const px = hx + t * dx;
        const py = hy + t * dy;
        const dist = Math.sqrt((ball.x - px) ** 2 + (ball.y - py) ** 2);

        // Flipper active collision with ball
        if (
          dist < ball.radius + FLIPPER_WIDTH / 2 &&
          ball.vy > 0 &&
          ball.y < hy &&
          ((side === "left" && leftFlipperRef.current.isDown) ||
            (side === "right" && rightFlipperRef.current.isDown))
        ) {
          // Flip and slightly randomize velocity
          // Flipper adds power to bounce if "down"
          ball.vy = -Math.abs(ball.vy) - 6 - Math.random() * 2;
          ball.vx += (side === "left" ? -3 : 3) + (Math.random() - 0.5) * 2;
          playSound("flipper");
        }
      });

      // Bumper collisions
      bumpers.forEach((bumper) => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + bumper.radius) {
          // Reflect away
          const angle = Math.atan2(dy, dx);
          const push = ball.radius + bumper.radius - dist;
          ball.x += Math.cos(angle) * push;
          ball.y += Math.sin(angle) * push;
          // Bounce off
          ball.vx += Math.cos(angle) * (2 + Math.random() * 1.5);
          ball.vy += Math.sin(angle) * (2 + Math.random() * 1.5);
          setScore((s) => s + bumper.score);
          playSound("bumper");
        }
      });

      // Target collisions (simple horizontal line check, activates once per hit)
      targets.forEach((target) => {
        if (target.hit) return;
        if (
          ball.y - ball.radius < target.y + 2 &&
          ball.y + ball.radius > target.y - 2 &&
          ball.x > target.x1 &&
          ball.x < target.x2
        ) {
          target.hit = true;
          setScore((s) => s + target.score);
          playSound("score");
        }
      });

      // Table bottom ("drain") detection
      if (ball.y - ball.radius > TABLE_HEIGHT) {
        ball.rolling = false;
        setGameOver(true);
        ball.vy = 0;
        ball.vx = 0;
      }
      // Ball position update
      if (ball.rolling) {
        ball.x += ball.vx;
        ball.y += ball.vy;
      }
    }
  };

  // Animation loop
  const animate = () => {
    update();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Drawing the full table, flippers, bumpers, ball, etc.
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    // Table background
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    // Playfield
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Arcade-style border
    ctx.save();
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(8, 8, TABLE_WIDTH - 16, TABLE_HEIGHT - 16, 56);
    ctx.stroke();
    ctx.restore();

    // Score Display at the top
    ctx.save();
    ctx.font = "bold 32px monospace";
    ctx.fillStyle = COLOR_SECONDARY;
    ctx.textAlign = "center";
    ctx.fillText("PINBALL MASTER", TABLE_WIDTH / 2, 48);
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(`SCORE: ${score}`, TABLE_WIDTH / 2, 90);
    ctx.restore();

    // Draw bumpers
    bumpers.forEach((bumper) => {
      // Bumper body
      ctx.save();
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius, 0, 2 * Math.PI);
      ctx.fillStyle = COLOR_BUMPER;
      ctx.shadowBlur = 18;
      ctx.shadowColor = COLOR_BUMPER_RING;
      ctx.fill();
      // Bumper highlight ring
      ctx.lineWidth = 6;
      ctx.strokeStyle = COLOR_BUMPER_RING;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    });

    // Draw targets
    targets.forEach((target) => {
      ctx.save();
      ctx.strokeStyle = target.hit ? COLOR_SECONDARY : COLOR_ACCENT;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(target.x1, target.y);
      ctx.lineTo(target.x2, target.y);
      ctx.stroke();
      ctx.restore();
    });

    // Flippers
    drawFlipper(ctx, leftFlipperRef.current, leftFlipperDown);
    drawFlipper(ctx, rightFlipperRef.current, rightFlipperDown);

    // Ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      ballRef.current.x,
      ballRef.current.y,
      ballRef.current.radius,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = COLOR_BALL;
    ctx.shadowBlur = 16;
    ctx.shadowColor = COLOR_SECONDARY;
    ctx.fill();
    ctx.restore();

    // Table feet (simple metallic cues)
    ctx.save();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 6;
    [44, TABLE_WIDTH - 44].forEach((fx) => {
      ctx.beginPath();
      ctx.moveTo(fx, TABLE_HEIGHT - 5);
      ctx.lineTo(fx, TABLE_HEIGHT + 25);
      ctx.stroke();
    });
    ctx.restore();

    // If game over, overlay message
    if (gameOver) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, TABLE_HEIGHT / 2 - 80, TABLE_WIDTH, 160);
      ctx.globalAlpha = 1.0;
      ctx.font = "bold 40px monospace";
      ctx.fillStyle = COLOR_SECONDARY;
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", TABLE_WIDTH / 2, TABLE_HEIGHT / 2 - 10);
      ctx.font = "20px monospace";
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(
        "Press SPACE to restart",
        TABLE_WIDTH / 2,
        TABLE_HEIGHT / 2 + 36
      );
      ctx.restore();
    }
  };

  // Helper: draw a flipper
  function drawFlipper(ctx, flipper, isPressed) {
    ctx.save();
    ctx.translate(flipper.x, flipper.y);
    ctx.rotate(((flipper.angle - 90) * Math.PI) / 180);
    ctx.fillStyle = isPressed ? COLOR_SECONDARY : COLOR_FLIPPER;
    ctx.shadowColor = COLOR_BG;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(
      0,
      -FLIPPER_WIDTH / 2,
      FLIPPER_LENGTH,
      FLIPPER_WIDTH,
      FLIPPER_WIDTH / 2
    );
    ctx.fill();
    // Flipper metallic accent
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.stroke();
    ctx.restore();
  }

  // Flipper animation (smooth up/down)
  const smoothAnimateFlippers = () => {
    // Left
    const left = leftFlipperRef.current;
    if (left.isDown && left.angle < left.maxAngle) {
      left.angle += 13;
      if (left.angle > left.maxAngle) left.angle = left.maxAngle;
    } else if (!left.isDown && left.angle > left.defAngle) {
      left.angle -= 13;
      if (left.angle < left.defAngle) left.angle = left.defAngle;
    }
    // Right
    const right = rightFlipperRef.current;
    if (right.isDown && right.angle > right.maxAngle) {
      right.angle -= 13;
      if (right.angle < right.maxAngle) right.angle = right.maxAngle;
    } else if (!right.isDown && right.angle < right.defAngle) {
      right.angle += 13;
      if (right.angle > right.defAngle) right.angle = right.defAngle;
    }
  };

  // Set up animation loop and keyboard/touch listeners
  useEffect(() => {
    // Init audio refs
    audioRefs.current.flipper = new window.Audio(SFX_FLIPPER);
    audioRefs.current.bumper = new window.Audio(SFX_BUMPER);
    audioRefs.current.score = new window.Audio(SFX_SCORE);

    // Touch, keyboard listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Start animation
    function animationStep() {
      if (!gameOver) smoothAnimateFlippers();
      animate();
    }
    animationRef.current = requestAnimationFrame(animationStep);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line
  }, [gameOver, handleKeyDown, handleKeyUp]);

  // On game over, show message and stop animation
  useEffect(() => {
    if (gameOver) {
      cancelAnimationFrame(animationRef.current);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }
    // eslint-disable-next-line
  }, [gameOver]);

  // Container styles for arcade-inspired look
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 56px)",
        background:
          "radial-gradient(circle at 60% 12%, #0f346060 0%, #1a1a2e 95%)",
        padding: "18px",
      }}
    >
      {/* Score and instructions area */}
      <div style={{ marginRight: 32 }}>
        <h2
          style={{
            color: COLOR_SECONDARY,
            fontSize: 34,
            margin: "18px 0 14px",
            fontFamily: "monospace",
            textShadow: "0 2px 10px #000a",
          }}
        >
          <span style={{ color: COLOR_ACCENT }}>Pinball Master</span>
        </h2>
        <div
          style={{
            color: COLOR_TEXT,
            fontFamily: "monospace",
            fontSize: 20,
            background: "#1a1a2eff",
            padding: "9px 16px",
            borderRadius: 12,
            border: "2px solid #222",
            marginBottom: 7,
            boxShadow: "0 2px 10px #0d1736cc",
            letterSpacing: "2px",
          }}
        >
          Score: <span style={{ color: COLOR_SECONDARY }}>{score}</span>
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: 14,
            lineHeight: 1.45,
            background: "#181c30dd",
            border: "1px solid #2c3e60",
            borderRadius: 8,
            padding: 8,
            marginBottom: 6,
            fontFamily: "monospace",
            width: 200,
          }}
        >
          <b>Controls:</b>
          <br />
          <span style={{ color: COLOR_SECONDARY }}>Left/Right Arrows</span>{" "}
          <span style={{ color: "#ddd" }}>or tap sides</span>
          <br />
          <span style={{ color: "#aaa" }}>Space</span> to reset if lose ball
        </div>
      </div>
      {/* Main Pinball Table */}
      <div
        style={{
          boxShadow: "0 6px 32px #0f346070, 0 1.5px 12px #e9456030",
          borderRadius: "34px",
          overflow: "hidden",
          border: `7px solid ${COLOR_ACCENT}`,
          background: "#10141a linear-gradient(180deg, #23294d 0%, #1a1a2e 77%)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          tabIndex="0"
          style={{
            display: "block",
            outline: "none",
            borderRadius: "28px",
            touchAction: "none",
            background: "#181946 linear-gradient(162deg, #282d52 0%, #10141a 100%)",
          }}
        ></canvas>
      </div>
      {/* Hidden audio tags for SFX */}
      <audio
        ref={(el) => (audioRefs.current.flipper = el)}
        src={SFX_FLIPPER}
        preload="auto"
        style={{ display: "none" }}
      />
      <audio
        ref={(el) => (audioRefs.current.bumper = el)}
        src={SFX_BUMPER}
        preload="auto"
        style={{ display: "none" }}
      />
      <audio
        ref={(el) => (audioRefs.current.score = el)}
        src={SFX_SCORE}
        preload="auto"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default PinballMaster;
