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
///// OFFLINE DATA LOADING - LOCAL JSON FILES
////////////////////////////////////////////////////////////

Vue.use(VueMeta);

new Vue({
    
  el: '#home-page',

  data () {
  
    return {
      lectureData: [],
      webinarData:[],
      aboutData: [],
      eventsData: [],
      alertData: [],
      currentDate: '',
      iniLoad: 0,
      eventsData: [],
      peopleData: [],
      supporterData: [],
      indexData: [],
      dataPath: 'data/' // Path to local JSON files
    }
  },

  created: function created() {
    this.fetchIndex();
    this.fetchWebinar();
    this.fetchAbout();
    this.fetchAlerts();
    this.fetchSupporter();
    this.fetchLecture();
    this.fetchPeople();
    this.expand();
    this.fetchEvents();
  },

  updated () {
    this.scrollToAnchor();
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
    },

    async fetchWebinar() {
      this.webinarData = await this.fetchLocalData('webinars.json');
    },

    async fetchAbout() {
      this.aboutData = await this.fetchLocalData('about.json');
    },

    async fetchEvents() {
      this.eventsData = await this.fetchLocalData('instructor_panel.json');
      this.currentDate = moment().tz("America/Toronto").format('YYYY-MM-DD');
    },

    async fetchPeople() {
      this.peopleData = await this.fetchLocalData('people.json');
    },

    async fetchAlerts() {
      this.alertData = await this.fetchLocalData('alert_banner.json');
    },

    async fetchLecture() {
      this.lectureData = await this.fetchLocalData('lecture.json');
    },

    async fetchSupporter() {
      this.supporterData = await this.fetchLocalData('supporters.json');
    },

    dateShow(date) {
      return moment(date).format("LL");
    },

    showDesc(eventO) {
      eventO['extended'] = true;
    },

    showExc(eventO) {
      eventO['extended'] = false;
    },

    expand(){
      var acc = document.getElementsByClassName("accordion");
      var i;

      for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
          this.classList.toggle("active");
          var panel = this.nextElementSibling;
          if (panel.style.maxHeight){
            panel.style.maxHeight = null;
          } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
          } 
        });
      }
    },

    scrollToAnchor () {
      this.$nextTick(() => {
        if(window.location.hash && this.iniLoad==0) {
          this.iniLoad = 1;
          setTimeout(() => {
            document.querySelector(window.location.hash).scrollIntoView();
          }, 100);
        }
      });
    }
  }
}); 