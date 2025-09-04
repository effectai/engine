<template>
  <SimpleSection>
    <div class="container">
      <div class="columns">
        <div class="column">
          <div class="columns is-vcentered h-full">
            <div
              class="column is-four-fifths is-full is-four-fifths-desktop"
            ></div>
          </div>
        </div>
        <div class="column is-two-thirds">
          <h1
            class="is-size-3 has-text-weight-medium has-text-primary has-text-left"
          >
            Syncing AI and Humanity: <br />
            <span class="has-text-grey">Building the Future Together</span>
          </h1>
        </div>
      </div>
      <NewsCardList :perPage="100" :items="news" class="my-7" />
    </div>
  </SimpleSection>
</template>

//
<script setup>
// const { data: news } = await useAsyncData("news", async () => {
// 	const data = await queryContent("/news").where({ published: true }).find();
//
// 	//sort on created date
// 	return data.sort((a, b) => {
// 		return new Date(b.created).getTime() - new Date(a.created).getTime();
// 	});
// });
</script>

<style lang="scss" scoped></style>
