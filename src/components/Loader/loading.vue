<template>
  <div class="loading-container">
    <span class="loader"></span>
  </div>
</template>

<script></script>

<style lang="scss" scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background-color: #333;
  z-index: 9999;
}
.loader {
  position: relative;
  top: 50%;
  left: 50%;
  width: 82px;
  height: 18px;
}
.loader::before,
.loader::after {
  content: "";
  position: absolute;
  left: 50%;
  transform: translate(-50%, 10%);
  top: 0;
  background: #ff3d00;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  animation: jump 0.5s ease-in infinite alternate;
}

.loader::after {
  background: #0000;
  color: #fff;
  top: 100%;
  box-shadow: 32px -20px, -32px -20px;
  animation: split 0.5s ease-out infinite alternate;
}

@keyframes split {
  0% {
    box-shadow: 8px -20px, -8px -20px;
  }
  100% {
    box-shadow: 32px -20px, -32px -20px;
  }
}
@keyframes jump {
  0% {
    transform: translate(-50%, -150%);
  }
  100% {
    transform: translate(-50%, 10%);
  }
}
</style>
