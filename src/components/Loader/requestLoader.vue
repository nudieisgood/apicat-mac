<template>
  <div class="request-loader">
    <div class="request-loader-box">
      <div class="request-loader-container">
        <div class="request-loader-header">
          <div class="request-loader-header__name">
            <free-style-shimmer
              :is-loading="true"
              height="28px"
              width="250px"
              border-radius="5px"
              color="#E0E0E0"
            />
          </div>
          <div class="request-loader-header__actions">
            <div class="request-loader-header__actions-item">
              <free-style-shimmer
                :is-loading="true"
                height="28px"
                width="70px"
                border-radius="5px"
                color="#E0E0E0"
              />
            </div>
            <div class="request-loader-header__actions-item">
              <free-style-shimmer
                :is-loading="true"
                height="28px"
                width="28px"
                border-radius="5px"
                color="#E0E0E0"
              />
            </div>
            <div class="request-loader-header__actions-item">
              <free-style-shimmer
                :is-loading="true"
                height="28px"
                width="28px"
                border-radius="5px"
                color="#E0E0E0"
              />
            </div>
          </div>
        </div>
        <div class="editor">
          <div class="editor__block editor__left-block">
            <div class="tab-list">
              <div class="tab-list__itme">
                <free-style-shimmer
                  :is-loading="true"
                  height="28px"
                  width="180px"
                  border-radius="5px"
                  color="#E0E0E0"
                />
              </div>
              <div class="tab-list__itme">
                <free-style-shimmer
                  :is-loading="true"
                  height="28px"
                  width="220px"
                  border-radius="5px"
                  color="#E0E0E0"
                />
              </div>
              <div class="tab-list__itme">
                <free-style-shimmer
                  :is-loading="true"
                  height="28px"
                  width="90px"
                  border-radius="5px"
                  color="#E0E0E0"
                />
              </div>
              <div class="tab-list__itme">
                <free-style-shimmer
                  :is-loading="true"
                  height="28px"
                  width="120px"
                  border-radius="5px"
                  color="#E0E0E0"
                />
              </div>
            </div>
            <div class="container">
              <free-style-shimmer
                :is-loading="true"
                height="180px"
                width="100%"
                border-radius="5px"
                color="#E0E0E0"
              />
            </div>
            <div class="container">
              <free-style-shimmer
                :is-loading="true"
                height="36px"
                width="400px"
                border-radius="5px"
                color="#E0E0E0"
              />
            </div>
          </div>
          <div class="editor__block editor__right-block"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$requestr-tabs-header-height: 28px;
$requestr-tabs-header-margin: 10px;

.request-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // padding: 10px;
  flex-basis: 100%;
  z-index: 99999;
  background-color: #ffffff;
}

.request-loader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  &__name {
    flex-basis: 50%;
  }

  &__actions {
    display: flex;
    //align-items: center;
  }

  &__actions-item {
    margin-right: 20px;
  }
}

.request-loader-box {
  height: 100%;
  // display: flex;
}

.request-loader-container {
  height: 100%;
  padding: 16px 8px;
  overflow: hidden;
}

.requester-pane {
  height: 100%;
}

.editor {
  height: 100%;
  display: flex;
  margin-top: 20px;

  &__block {
    height: 100%;
  }

  &__left-block {
    flex: 1;
    // padding-right: 10px;
  }

  &__right-block {
    position: relative;
  }
}

.tab-list {
  display: flex;
  gap: 24px;
}

.container {
  margin-top: 20px;
}
</style>
