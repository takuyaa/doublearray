<script setup lang="ts">
import doublearray from "@/doublearray.ts";

const words = [
  { k: "a", v: 1 },
  { k: "abc", v: 2 },
  { k: "奈良", v: 3 },
  { k: "奈良先端", v: 4 },
  { k: "奈良先端科学技術大学院大学", v: 5 },
];

const trie = doublearray.builder().build(words);
</script>

<template>
  <div id="content">
    {{ trie.commonPrefixSearch("奈良先端科学技術大学院大学") }}
  </div>
</template>
