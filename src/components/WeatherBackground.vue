<script setup lang="ts">
import { computed } from 'vue'

/**
 * 天气全局背景动效
 * 白天（浅色）依据 WMO weather_code 映射到 4 个场景：sunny / cloudy / rain / snow
 * - 晴：CSS 渐变光晕 + 旋转光芒
 * - 多云：SVG 云朵 + 视差平移
 * - 雨：JS 随机雨滴 + CSS 下落关键帧
 * - 雪：JS 随机雪花 + 飘落漂移
 * 夜间模式（dark）：不再区分天气，统一展示月亮 + 星空
 */
const props = defineProps<{ code: number | null; dark?: boolean }>()

type Scene = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'night'

const RAIN = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]
const SNOW = [71, 73, 75, 77, 85, 86]
const SUNNY = [0, 1]

const scene = computed<Scene>(() => {
  // 夜间模式下无视天气代码，统一展示月亮
  if (props.dark) return 'night'
  const c = props.code
  if (c == null) return 'sunny'
  if (SUNNY.includes(c)) return 'sunny'
  if (SNOW.includes(c)) return 'snow'
  if (RAIN.includes(c)) return 'rain'
  return 'cloudy' // 2/3 多云阴、45/48 雾等归入多云
})

const rand = (min: number, max: number) => min + Math.random() * (max - min)

interface Drop {
  left: number
  delay: number
  dur: number
  len: number
  opacity: number
}
const drops: Drop[] = Array.from({ length: 60 }, () => ({
  left: rand(-10, 120),
  delay: rand(-2.2, 0),
  dur: rand(1.2, 2),
  len: rand(28, 52),
  opacity: rand(0.4, 0.85),
}))

interface Flake {
  left: number
  delay: number
  dur: number
  size: number
  drift: number
  opacity: number
}
const flakes: Flake[] = Array.from({ length: 42 }, () => ({
  left: rand(0, 100),
  delay: rand(-6, 0),
  dur: rand(6, 12),
  size: rand(8, 16),
  drift: rand(-8, 8),
  opacity: rand(0.4, 0.9),
}))

// 夜间星空：随机小星星（位置 / 大小 / 闪烁节奏）
interface Star {
  left: number
  top: number
  size: number
  delay: number
  dur: number
}
const stars: Star[] = Array.from({ length: 46 }, () => ({
  left: rand(0, 100),
  top: rand(0, 62),
  size: rand(1, 2.6),
  delay: rand(-4, 0),
  dur: rand(2.4, 5),
}))

// 云朵配置（多云 / 雨天顶部共用）
const clouds = [
  { top: 8, scale: 1, dur: 82, delay: 0, opacity: 0.9 },
  { top: 22, scale: 0.65, dur: 120, delay: -30, opacity: 0.6 },
  { top: 4, scale: 0.8, dur: 100, delay: -60, opacity: 0.75 },
]
</script>

<template>
  <div class="weather-bg" :class="scene" aria-hidden="true">
    <!-- 夜间：月亮 + 星空（不分晴/雨/雪） -->
    <template v-if="scene === 'night'">
      <div class="stars">
        <span
          v-for="(s, i) in stars"
          :key="i"
          class="star"
          :style="{
            left: s.left + '%',
            top: s.top + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            animationDuration: s.dur + 's',
            animationDelay: s.delay + 's',
          }"
        />
      </div>
      <div class="moon">
        <div class="moon-glow" />
        <div class="moon-body">
          <span class="crater c1" />
          <span class="crater c2" />
          <span class="crater c3" />
        </div>
      </div>
    </template>

    <!-- 晴天：光晕 + 旋转光芒 -->
    <template v-else-if="scene === 'sunny'">
      <div class="sun">
        <div class="sun-rays" />
        <div class="sun-core" />
      </div>
    </template>

    <!-- 多云：SVG 云朵视差平移 -->
    <template v-else-if="scene === 'cloudy'">
      <svg
        v-for="(c, i) in clouds"
        :key="i"
        class="cloud"
        viewBox="0 0 640 512"
        :style="{
          top: c.top + '%',
          transform: `scale(${c.scale})`,
          opacity: c.opacity,
          animationDuration: c.dur + 's',
          animationDelay: c.delay + 's',
        }"
      >
        <path
          fill="currentColor"
          d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"
        />
      </svg>
    </template>

    <!-- 雨天：顶部云 + 随机雨滴 -->
    <template v-else-if="scene === 'rain'">
      <svg
        v-for="(c, i) in clouds"
        :key="i"
        class="cloud rain-cloud"
        viewBox="0 0 640 512"
        :style="{
          top: c.top + '%',
          transform: `scale(${c.scale})`,
          opacity: c.opacity * 0.8,
          animationDuration: c.dur * 1.4 + 's',
          animationDelay: c.delay + 's',
        }"
      >
        <path
          fill="currentColor"
          d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"
        />
      </svg>
      <div class="rainfall">
        <span
          v-for="(d, i) in drops"
          :key="i"
          class="drop"
          :style="{
            left: d.left + '%',
            height: d.len + 'px',
            opacity: d.opacity,
            animationDuration: d.dur + 's',
            animationDelay: d.delay + 's',
          }"
        />
      </div>
    </template>

    <!-- 雪：随机飘落雪花 -->
    <template v-else-if="scene === 'snow'">
      <div class="snowfall">
        <span
          v-for="(f, i) in flakes"
          :key="i"
          class="flake"
          :style="{
            left: f.left + '%',
            width: f.size + 'px',
            height: f.size + 'px',
            opacity: f.opacity,
            '--drift': f.drift + 'vw',
            animationDuration: f.dur + 's',
            animationDelay: f.delay + 's',
          }"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  --cloud: rgba(96, 118, 158, 0.3);
  transition: background 0.6s ease;
}
:global([data-theme='dark']) .weather-bg {
  --cloud: rgba(200, 214, 240, 0.26);
}

/* ---------- 晴天 ---------- */
.weather-bg.sunny {
  background:
    radial-gradient(
      1000px 720px at 82% -14%,
      rgba(255, 209, 102, 0.45),
      rgba(255, 179, 71, 0.12) 46%,
      transparent 70%
    ),
    linear-gradient(180deg, rgba(120, 190, 255, 0.18), transparent 46%);
}
:global([data-theme='dark']) .weather-bg.sunny {
  background:
    radial-gradient(
      1000px 720px at 82% -14%,
      rgba(255, 196, 84, 0.28),
      rgba(255, 150, 50, 0.1) 46%,
      transparent 70%
    ),
    linear-gradient(180deg, rgba(70, 110, 170, 0.16), transparent 46%);
}
.sun {
  position: absolute;
  top: -70px;
  right: 7%;
  width: 220px;
  height: 220px;
  animation: spin 30s linear infinite;
}
.sun-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 244, 200, 0.95),
    rgba(255, 205, 90, 0.85) 46%,
    rgba(255, 175, 60, 0.28) 70%,
    transparent 76%
  );
  filter: blur(1px);
  animation: sun-pulse 6s ease-in-out infinite;
}
.sun-rays {
  position: absolute;
  inset: -70%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 220, 140, 0.22) 0deg 3deg,
    transparent 3deg 16deg
  );
  -webkit-mask: radial-gradient(circle, #000 26%, transparent 68%);
  mask: radial-gradient(circle, #000 26%, transparent 68%);
  animation: spin 46s linear infinite;
}
@keyframes sun-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 夜间：月亮 + 星空 ---------- */
.weather-bg.night {
  background:
    radial-gradient(
      900px 640px at 80% -12%,
      rgba(148, 163, 210, 0.22),
      rgba(90, 104, 160, 0.08) 46%,
      transparent 70%
    ),
    linear-gradient(180deg, rgba(28, 34, 62, 0.42), rgba(15, 17, 23, 0.12) 60%, transparent);
}
.moon {
  position: absolute;
  top: -40px;
  right: 8%;
  width: 180px;
  height: 180px;
  animation: moon-float 12s ease-in-out infinite;
}
.moon-glow {
  position: absolute;
  inset: -34%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(226, 232, 255, 0.5),
    rgba(196, 208, 245, 0.18) 44%,
    transparent 68%
  );
  filter: blur(2px);
  animation: moon-pulse 6s ease-in-out infinite;
}
.moon-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 34%,
    #fdfcf5,
    #eef1fb 46%,
    #cfd6ec 78%,
    #b7c0dd
  );
  box-shadow:
    inset -14px -12px 28px rgba(120, 132, 172, 0.5),
    0 0 26px rgba(210, 220, 255, 0.35);
}
.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(150, 160, 195, 0.4);
  box-shadow: inset 1px 1px 2px rgba(110, 120, 155, 0.55);
}
.crater.c1 {
  top: 26%;
  left: 30%;
  width: 26px;
  height: 26px;
}
.crater.c2 {
  top: 54%;
  left: 52%;
  width: 34px;
  height: 34px;
}
.crater.c3 {
  top: 62%;
  left: 26%;
  width: 16px;
  height: 16px;
}
@keyframes moon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}
@keyframes moon-pulse {
  0%,
  100% {
    opacity: 0.85;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
.stars {
  position: absolute;
  inset: 0;
}
.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  animation-name: star-twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes star-twinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ---------- 多云 / 雨天云朵 ---------- */
.weather-bg.cloudy {
  background: linear-gradient(180deg, rgba(120, 140, 170, 0.22), transparent 56%);
}
.weather-bg.rain {
  background:
    radial-gradient(800px 420px at 70% -12%, rgba(90, 110, 140, 0.28), transparent 62%),
    linear-gradient(180deg, rgba(58, 78, 108, 0.3), rgba(40, 55, 80, 0.1) 62%, transparent);
}
.cloud {
  position: absolute;
  left: 0;
  width: 220px;
  height: auto;
  color: var(--cloud);
  transform-origin: center;
  animation-name: cloud-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  filter: drop-shadow(0 8px 14px rgba(30, 45, 70, 0.12));
}
.rain-cloud {
  color: rgba(70, 88, 118, 0.5);
}
:global([data-theme='dark']) .rain-cloud {
  color: rgba(150, 168, 200, 0.4);
}
@keyframes cloud-drift {
  from {
    margin-left: -28vw;
  }
  to {
    margin-left: 112vw;
  }
}

/* ---------- 雨滴 ---------- */
.rainfall {
  position: absolute;
  inset: 0;
}
.drop {
  position: absolute;
  top: 0;
  width: 1.4px;
  border-radius: 2px;
  background: linear-gradient(to bottom, transparent, rgba(150, 190, 255, 0.9));
  animation-name: rain-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes rain-fall {
  from {
    transform: translate(0, -20vh) rotate(12deg);
  }
  to {
    transform: translate(-30vh, 120vh) rotate(12deg);
  }
}

/* ---------- 雪花 ---------- */
.weather-bg.snow {
  background: linear-gradient(180deg, rgba(150, 170, 200, 0.24), transparent 56%);
}
.snowfall {
  position: absolute;
  inset: 0;
}
.flake {
  position: absolute;
  top: -6%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #fff, rgba(255, 255, 255, 0.75));
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.7);
  animation-name: snow-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes snow-fall {
  from {
    transform: translate(0, -6vh) rotate(0deg);
  }
  to {
    transform: translate(var(--drift, 0), 106vh) rotate(360deg);
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  .sun {
    width: 150px;
    height: 150px;
    top: -50px;
  }
  .moon {
    width: 124px;
    height: 124px;
    top: -28px;
  }
  .cloud {
    width: 150px;
  }
}

/* ---------- 无障碍：尊重减少动态偏好 ---------- */
@media (prefers-reduced-motion: reduce) {
  .sun,
  .sun-core,
  .sun-rays,
  .cloud,
  .moon,
  .moon-glow,
  .star {
    animation: none !important;
  }
  .rainfall,
  .snowfall {
    display: none;
  }
}
</style>
