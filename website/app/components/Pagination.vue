<template>
  <nav
    class="flex w-full justify-between items-center space-x-4 mt-6"
    role="navigation"
    aria-label="pagination"
  >
    <!-- Previous Button -->
    <button
      :disabled="currentPage === 1"
      @click="prevPage"
      :class="[
        'px-4 py-2 rounded-full border',
        currentPage === 1
          ? 'cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300'
          : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100',
      ]"
      aria-label="Previous Page"
    >
      Previous
    </button>

    <!-- Page Number Links -->
    <ul class="flex space-x-2">
      <li v-for="page in pages" :key="page">
        <button
          @click="selectPage(page)"
          :aria-current="page === currentPage ? 'page' : undefined"
          :class="[
            'px-3 py-1 rounded-full border',
            page === currentPage
              ? 'bg-black text-white border-white'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100',
          ]"
        >
          {{ page }}
        </button>
      </li>
    </ul>

    <!-- Next Button -->
    <button
      :disabled="currentPage === totalPages"
      @click="nextPage"
      :class="[
        'px-4 py-2 rounded-full border',
        currentPage === totalPages
          ? 'cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300'
          : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100',
      ]"
      aria-label="Next Page"
    >
      Next
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from "vue";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (event: "pageChanged", page: number): void;
}>();

const pages = computed(() => {
  return Array.from({ length: props.totalPages }, (_, i) => i + 1);
});

function selectPage(page: number) {
  if (page !== props.currentPage) {
    emit("pageChanged", page);
  }
}

function nextPage() {
  if (props.currentPage < props.totalPages) {
    emit("pageChanged", props.currentPage + 1);
  }
}

function prevPage() {
  if (props.currentPage > 1) {
    emit("pageChanged", props.currentPage - 1);
  }
}
</script>

<style scoped></style>
