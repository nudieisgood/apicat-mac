<template>
  <div ref="otpCont" class="digit-box-wrapper">
    <input
      type="text"
      class="digit-box"
      v-for="(el, ind) in digits"
      :key="el + ind"
      v-model="digits[ind]"
      :autofocus="ind === 0"
      maxlength="1"
      @keydown="handleKeyDown($event, ind)"
      :class="{ bounce: digits[ind] !== null }"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

const props = defineProps({
  default: String,

  digitCount: {
    type: Number,
    required: true,
  },
});

const digits = reactive([]);

if (props.default && props.default.length === props.digitCount) {
  for (let i = 0; i < props.digitCount; i++) {
    digits[i] = props.default.charAt(i);
  }
} else {
  for (let i = 0; i < props.digitCount; i++) {
    digits[i] = null;
  }
}

const otpCont = ref(null);

const emit = defineEmits(["update:otp"]);

const isDigitsFull = function () {
  for (const elem of digits) {
    if (elem == null || elem == undefined) {
      return false;
    }
  }

  return true;
};

const handleKeyDown = function (event, index) {
  if (
    event.key !== "Tab" &&
    event.key !== "ArrowRight" &&
    event.key !== "ArrowLeft"
  ) {
    event.preventDefault();
  }

  if (event.key === "Backspace") {
    digits[index] = null;

    if (index !== 0) {
      otpCont.value.children[index - 1].focus();
    }

    emit("update:otp", digits.join(""));
    return;
  }

  if (new RegExp("^([0-9])$").test(event.key)) {
    digits[index] = event.key;

    if (index != props.digitCount - 1) {
      otpCont.value.children[index + 1].focus();
    }

    if (isDigitsFull()) {
      emit("update:otp", digits.join(""));
    }
  }
};
</script>

<style scoped lang="scss">
.digit-box-wrapper {
  margin-bottom: 10px;
  text-align: center;
}
.digit-box {
  height: 36px;
  width: 36px;
  border: 2px solid #808080;
  display: inline-block;
  border-radius: 5px 8px;
  margin: 5px;
  // padding: 15px;
  text-align: center;
  font-size: 24px;
}
.digit-box:focus {
  outline: 1px solid #808080;
}

.bounce {
  animation: pulse 0.3s ease-in-out alternate;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(1.1);
  }
}
</style>
