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
      webinarData: [],
      currentDate: '',
      indexData: [],
      eventsData: [],
      slugData: '',
      apiURL: 'https://directus.thegovlab.com/ai-ethics',
    }
  },

  created: function created() {
    this.memberslug=window.location.href.split('/');
    this.memberslug = this.memberslug[this.memberslug.length - 1];
    this.fetchWebinar();
    this.fetchEvents();
    this.fetchIndex();
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
  self.slugData = this.memberslug;
  console.log(self.slugData);
})
.catch(error => console.error(error));
    },
    fetchWebinar() {
      self = this;
      const client = new DirectusSDK({
        url: "https://directus.thegovlab.com/",
        project: "ai-ethics",
        storage: window.localStorage
      });

      client.getItems(
  'webinars',
  {

    fields: ['*.*']
  }
).then(data => {
  console.log(data)
  self.webinarData = data.data;
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
    dateShow(date) {
      return moment(date).format("LL");
    },
}});


