<template>
    <div
        @click="handleClick" 
        class="launch-button button has-text-weight-normal is-size-6 pr-2 is-rounded has-text-white has-background-black"
    >   
        <slot>{{ text }}</slot>
        <div class="button-arrow ml-4 is-flex is-justify-content-center is-align-items-center has-background-white"><img src="/img/arrow-vector.svg" alt="arrow vector" /></div>
    </div>
</template>

<script>

export default {
props: {
    text: {type: String, default: 'Click me'},
    clickHandler: {type: Function, default: () => {}}
    
},
methods: {
    handleClick() {
    this.clickHandler();
    }
}
}
</script>

<style scoped>

.launch-button{
    border-color: black;
}
.button-arrow{
    width: 2em;
    height: 2em;
    border-radius: 50%;
  }
</style>
