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

new Vue({
    
  el: '#home-page',
    
  data () {
 
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
    this.memberslug = window.location.href.split('/');
    this.memberslug = this.memberslug[this.memberslug.length - 1];
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