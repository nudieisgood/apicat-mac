<template>
  <div class="layout-loader">
    <div class="layout-loader-header">
      <div class="layout-loader-header__left">
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="28px"
          border-radius="5px"
          color="#E0E0E0"
        />
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="150px"
          border-radius="5px"
          color="#E0E0E0"
        />
      </div>
      <div class="layout-loader-header__right">
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="200px"
          border-radius="5px"
          color="#E0E0E0"
        />
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="28px"
          border-radius="5px"
          color="#E0E0E0"
        />
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="28px"
          border-radius="5px"
          color="#E0E0E0"
        />
        <free-style-shimmer
          :is-loading="true"
          height="28px"
          width="28px"
          border-radius="5px"
          color="#E0E0E0"
        />
      </div>
    </div>
    <div class="layout-loader-container">
      <div class="layout-loader-side">
        <div class="tab-list">
          <div class="tab-list__item">
            <free-style-shimmer
              :is-loading="true"
              height="28px"
              width="28px"
              border-radius="5px"
              color="#E0E0E0"
            />
          </div>
          <div class="tab-list__item">
            <free-style-shimmer
              :is-loading="true"
              height="28px"
              width="28px"
              border-radius="5px"
              color="#E0E0E0"
            />
          </div>
          <div class="tab-list__item">
            <free-style-shimmer
              :is-loading="true"
              height="28px"
              width="28px"
              border-radius="5px"
              color="#E0E0E0"
            />
          </div>
        </div>
        <free-style-shimmer
          :is-loading="true"
          height="100%"
          width="100%"
          border-radius="5px"
          color="#E0E0E0"
        />
      </div>
      <div class="layout-loader-container__content">
        <free-style-shimmer
          :is-loading="true"
          height="100%"
          width="100%"
          border-radius="5px"
          color="#E0E0E0"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  // setup () {
  //   return {
  //   }
  // }
};
</script>
<style lang="scss" scoped>
$header-height: 65px;
$footer-height: 30px;

.layout-loader {
  position: relative;
  z-index: 9999;
  height: 100%;
  background-color: #ffffff;

  &:deep(.shimmer) {
    width: 100%;
    height: 100%;
  }
}

.layout-loader-side {
  width: 400px;
  height: calc(100% - #{$footer-height});
  padding-right: 10px;
  display: flex;
}

.tab-list {
  margin-right: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.layout-loader-container {
  height: calc(100% - #{$header-height});
  display: flex;
  padding: 0 24px 0 15px;

  &__content {
    width: calc(100% - 400px);
    height: calc(100% - #{$footer-height});
  }
}

.layout-loader-header {
  height: $header-height;
  padding: 0 24px 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__left {
    display: flex;
    gap: 24px;
  }

  &__right {
    display: flex;
    gap: 24px;
  }
}
</style>
