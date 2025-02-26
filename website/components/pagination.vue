<template>
  <nav class="pagination is-medium is-centered mt-6" role="navigation" aria-label="pagination">
    <a
      class="pagination-previous"
      :class="{ 'is-disabled': currentPage === 1 }"
      @click="prevPage"
    >
      Previous
    </a>
    <a
      class="pagination-next"
      :class="{ 'is-disabled': currentPage === totalPages }"
      @click="nextPage"
    >
      Next
    </a>
    <ul class="pagination-list">
      <li v-for="page in pages" :key="page">
        <a
          class="pagination-link"
          :class="{ 'is-current': page === currentPage }"
          @click="selectPage(page)"
        >
          {{ page }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (event: 'pageChanged', page: number): void
}>()

const pages = computed(() => {
  return Array.from({ length: props.totalPages }, (_, i) => i + 1)
})

function selectPage(page: number) {
  if (page !== props.currentPage) {
    emit('pageChanged', page)
  }
  console.log(props.currentPage === 1)
}

function nextPage() {
  if (props.currentPage < props.totalPages) {
    emit('pageChanged', props.currentPage + 1)
  }
}

function prevPage() {
  if (props.currentPage > 1) {
    emit('pageChanged', props.currentPage - 1)
  }
}
</script>

<style scoped>
</style>
