////////////////////////////////////////
// reload page after Forward and back
///////////////////////////////////////

const TYPE_BACK_FORWARD = 2;

function isReloadedPage() {
  return performance.navigation.type === TYPE_BACK_FORWARD;
}

function main() {
  if (isReloadedPage()) {
    window.location.reload();
  }
}
main();

////////////////////////////////////////////////////////////
///// OFFLINE WEBINAR DATA LOADING - LOCAL JSON FILES
////////////////////////////////////////////////////////////

Vue.use(VueMeta);

// Pages written by scripts/prerender.mjs (webinars/<slug>.html) already contain the data in
// #webinar-data and the Vue template in #webinar-tpl, so Vue renders the same markup straight
// away instead of loading the JSON files. webinars/index.html still loads them.
var prerenderedEl = document.getElementById('webinar-data');
var prerenderedWebinar = prerenderedEl ? JSON.parse(prerenderedEl.textContent) : null;

new Vue({

  el: '#home-page',
  template: document.getElementById('webinar-tpl') ? '#webinar-tpl' : undefined,

  data () {

    if (prerenderedWebinar) {
      return {
        webinarData: prerenderedWebinar.webinarData,
        currentDate: moment().tz("America/Toronto").format('YYYY-MM-DD'),
        indexData: prerenderedWebinar.indexData,
        eventsData: prerenderedWebinar.eventsData,
        slugData: prerenderedWebinar.slugData,
        supporterData: prerenderedWebinar.supporterData,
        dataPath: '/data/' // Path to local JSON files
      }
    }
    return {
      webinarData: [],
      currentDate: '',
      indexData: [],
      eventsData: [],
      slugData: '',
      supporterData: [],
      dataPath: '/data/' // Path to local JSON files
    }
  },

  created: function created() {
    // Last path segment, without a trailing slash, ".html", query string or hash.
    var path = window.location.pathname.replace(/\/+$/, '');
    this.memberslug = decodeURIComponent(path.substring(path.lastIndexOf('/') + 1)).replace(/\.html$/, '');
    if (prerenderedWebinar) return;
    this.fetchWebinar();
    this.fetchEvents();
    this.fetchIndex();
    this.fetchSupporter();
  },

  methods: {
    // Generic fetch function for local JSON files
    async fetchLocalData(filename) {
      try {
        const response = await fetch(this.dataPath + filename);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data || data; // Handle both Directus format and plain JSON
      } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        return [];
      }
    },

    async fetchIndex() {
      this.indexData = await this.fetchLocalData('intro_elements.json');
      this.slugData = this.memberslug;
    },

    async fetchWebinar() {
      this.webinarData = await this.fetchLocalData('webinars.json');
    },

    async fetchEvents() {
      this.eventsData = await this.fetchLocalData('instructor_panel.json');
      this.currentDate = moment().tz("America/Toronto").format('YYYY-MM-DD');
    },

    async fetchSupporter() {
      this.supporterData = await this.fetchLocalData('supporters.json');
    },

    dateShow(date) {
      return moment(date).format("LL");
    }
  }
}); 