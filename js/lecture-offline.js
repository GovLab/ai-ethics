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
///// OFFLINE LECTURE DATA LOADING - LOCAL JSON FILES
////////////////////////////////////////////////////////////

// Wait for Vue to be available
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Vue === 'undefined') {
    console.error('Vue.js not loaded');
    return;
  }

  Vue.use(VueMeta);

  // Pages written by scripts/prerender.mjs (lectures/<slug>.html) already contain the lecture:
  // the data is in #lecture-data and the Vue template in #lecture-tpl, so Vue renders the same
  // markup straight away instead of loading lecture.json. lectures/index.html still loads it.
  var prerenderedData = document.getElementById('lecture-data');
  var prerenderedLecture = prerenderedData ? JSON.parse(prerenderedData.textContent) : null;

  new Vue({
    el: '#home-page',
    template: document.getElementById('lecture-tpl') ? '#lecture-tpl' : undefined,

    data() {
      return {
        lectureData: prerenderedLecture || [],
        dataPath: '/data/',
        loading: !prerenderedLecture,
        error: null
      }
    },

    async mounted() {
      console.log('Vue app mounted');
      // Last path segment, without a trailing slash, ".html", query string or hash.
      var path = window.location.pathname.replace(/\/+$/, '');
      this.lectureslug = decodeURIComponent(path.substring(path.lastIndexOf('/') + 1)).replace(/\.html$/, '');
      console.log('Lecture slug:', this.lectureslug);
      if (prerenderedLecture) return;
      await this.fetchLecture();
    },

    methods: {
      async fetchLocalData(filename) {
        try {
          console.log('Fetching:', this.dataPath + filename);
          const response = await fetch(this.dataPath + filename);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Raw data received, length:', data.data ? data.data.length : 'no data.data');
          return data.data || data;
        } catch (error) {
          console.error(`Error loading ${filename}:`, error.message);
          this.error = error.message;
          return [];
        }
      },

      async fetchLecture() {
        try {
          console.log('Fetching lecture data...');
          const allLectures = await this.fetchLocalData('lecture.json');
          console.log('All lectures count:', allLectures.length);
          
          // Filter lectures by slug
          this.lectureData = allLectures.filter(lecture => 
            lecture.slug === this.lectureslug
          );
          
          console.log('Filtered lecture data:', this.lectureData);
          console.log('Lecture data length:', this.lectureData.length);
          
          if (this.lectureData.length === 0) {
            console.warn('No lecture found for slug:', this.lectureslug);
            this.error = `No lecture found for slug: ${this.lectureslug}`;
          }
        } catch (error) {
          console.error('Error in fetchLecture:', error);
          this.error = error.message;
        } finally {
          this.loading = false;
        }
      }
    }
  });
}); 