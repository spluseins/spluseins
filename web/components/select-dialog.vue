<template>
  <lazy-hydrate
    ssr-only
    :trigger-hydration="dialogOpen"
  >
    <v-dialog
      v-model="dialogOpen"
      max-width="450"
      scrollable
    >
      <v-card>
        <v-toolbar
          dark
          color="primary"
        >
          <v-btn
            icon
            dark
            @click.native="dialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>{{ title }}</v-toolbar-title>
        </v-toolbar>

        <v-card-text class="card-text-padding">
          <v-list>
            <v-list-tile
              ripple
              @click="toggleAll"
              v-if="this.items.length >= 5"
            >
              <v-list-tile-action>
                <v-icon>{{ selectAllIcon }}</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Alle auswählen</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider v-if="this.items.length >= 5" />
            <v-list-tile
              ripple
              v-for="item in items"
              :key="!!item.description? item.description: item.label"
              @click="toggleSelection(item)"
            >
              <v-list-tile-action>
                <v-list-tile-action>
                  <v-icon v-if="selected.includes(item)">
                    mdi-check
                  </v-icon>
                </v-list-tile-action>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>{{ !!item.description? item.description: item.label }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </lazy-hydrate>
</template>

<script>

export default {
  name: 'SelectDialog',
  data () {
    return {
      selected: [...this.parentSelection]
    }
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Titel'
    },
    items: {
      type: Array,
      default: () => []
    },
    parentSelection: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasCheckedAllItems () {
      return this.selected.length === this.items.length
    },
    hasCheckedSomeItems () {
      return this.selected.length > 0 && !this.hasCheckedAllItems
    },
    selectAllIcon () {
      if (this.hasCheckedAllItems) return 'mdi-check'
      if (this.hasCheckedSomeItems) return 'mdi-minus'
      return ''
    },
    dialogOpen: {
      get () { return this.open; },
      set (value) { this.$emit('update:open', value); }
    }
  },
  methods: {
    toggleAll () {
      this.$nextTick(() => {
        if (this.hasCheckedAllItems) {
          this.selected = []
        } else {
          this.selected = this.items.slice()
        }
        this.$emit('update:parentSelection', this.selected);
      })
    },
    toggleSelection (item) {
      if (this.selected.includes(item)) {
        this.selected = this.selected.filter(el => el !== item)
      } else {
        this.selected.push(item)
      }
      this.$emit('update:parentSelection', this.selected);
    }
  }
};
</script>

<style scoped lang="scss">

.card-text-padding{
  padding: 0px 5px;
}

</style>
