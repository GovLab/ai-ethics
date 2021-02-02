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
      iniLoad: 0,
      peopleData: [],
      supporterData: [],
      indexData: [],
      apiURL: 'https://directus.thegovlab.com/ai-ethics',
    }
  },

  created: function created() {

    this.fetchIndex();
    this.fetchSupporter();
    this.fetchLecture();
    this.fetchPeople();
    this.expand();
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
          $el && window.scrollTo(0, $el.offsetTop);
           this.iniLoad = 1;
        }
      });
    }
}
});


