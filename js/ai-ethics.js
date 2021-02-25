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
///// TEAM  API REQUEST ` `
////////////////////////////////////////////////////////////


Vue.use(VueMeta);

new Vue({
    
  el: '#home-page',

  data () {
  
    return {
      lectureData: [],
      aboutData: [],
      eventsData: [],
      alertData: [],
      currentDate: '',
      iniLoad: 0,
      eventsData: [],
      peopleData: [],
      supporterData: [],
      indexData: [],
      apiURL: 'https://directus.thegovlab.com/ai-ethics'
    }
  },

  created: function created() {

    this.fetchIndex();
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
    fetchIndex() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'intro_elements',
  {
    fields: ['*.*']
  }
).then(data => {
  console.log(data)
  self.indexData = data.data;
})
.catch(error => console.error(error));
    },
    fetchAbout() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'about',
  {
    fields: ['*.*']
  }
).then(data => {
  console.log(data)
  self.aboutData = data.data;
})
.catch(error => console.error(error));
    },
    fetchEvents() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'instructor_panel',
  {
    sort: '-date',
    fields: ['*.*','panelists.people_id.*','thumbnail.*']
  }
).then(data => {

  this.currentDate = moment().tz("America/Toronto").format('YYYY-MM-DD');
  self.eventsData = data.data;
  console.log(self.eventsData);

})
.catch(error => console.error(error));
    },
    fetchPeople() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'people',
  {
    fields: ['*.*']
  }
).then(data => {
  console.log(data)
  self.peopleData = data.data;
})
.catch(error => console.error(error));
    },
    dateShow(date) {
      return moment(date).format("LL");
    },
    fetchAlerts() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'alert_banner',
  {
    fields: ['*.*']
  }
).then(data => {
  self.alertData = data.data;

})

.catch(error => console.error(error));
    },
    fetchLecture() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'lecture',
  {
    fields: ['*.*','faculty.faculty_junction_id.*','faculty.faculty_junction_id.headshot.*']
  }
).then(data => {
  console.log(data)
  self.lectureData = data.data;
})
.catch(error => console.error(error));
    },
    fetchSupporter() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'supporters',
  {
    fields: ['*.*'],
  }
).then(data => {
  console.log(data)
  self.supporterData = data.data;
  
})
.catch(error => console.error(error));
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
          const $el = document.getElementById(window.location.hash.substring(1));
          window.scrollTo(0, $el.offsetTop);
           this.iniLoad = 1;
        }
      });
    }
}
});


