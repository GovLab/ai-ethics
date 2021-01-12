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
      apiURL: 'https://directus.thegovlab.com/ai-ethics',
    }
  },

  created: function created() {

    this.lectureslug=window.location.href.split('/');
    this.lectureslug = this.lectureslug[this.lectureslug.length - 1];
    this.fetchLecture();

  },


  methods: {

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
    filter: {
      slug: self.lectureslug
    },
    fields: ['*.*','faculty.faculty_junction_id.*','readings.reading_junction_id.*']
  }
).then(data => {
  console.log(self.lectureslug)
  self.lectureData = data.data;
})
.catch(error => console.error(error));
    },

}
});


