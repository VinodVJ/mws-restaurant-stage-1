/**
 * Common database helper functions.
 */

 const idb_version = 2;
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  // Index DB

  static IDBCreate(restaurants) {
    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    if (!window.indexedDB) {
      window.alert("Your browser doesn't support IndexedDB hence this feature will not be available.");
      return;
    }
    let open = indexedDB.open("RestaurantsRevDB", idb_version);

    open.onupgradeneeded = function () {
      let db = open.result;
      let store = db.createObjectStore("ResturantStore", { keyPath: "id" });
      let localdata = db.createObjectStore("localdata", { keyPath: "id" });
      let reviews = db.createObjectStore("reviews", { keyPath: "id" });
      let index = store.createIndex("by-id", "id");
    };

    open.onerror = function (err) {
      console.error("Something wrong with IndexDB: " + err.target.errorCode);
    }

    open.onsuccess = function () {
      let db = open.result;
      let tx = db.transaction("ResturantStore", "readwrite");
      let rwtx = db.transaction("reviews", "readwrite");
      let lcdtx = db.transaction("localdata", "readwrite");
      let store = tx.objectStore("ResturantStore");
      let index = store.index("by-id");
      restaurants.forEach(function (restaurant) {
        store.put(restaurant);
      });
      DBHelper.fetchReviewsFromServer();
      tx.oncomplete = function () {
        db.close();
      };
    }
    // DBHelper.idbSync();
  }

  static getCachedData(callback) {
    let restaurants = [];
    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    if (!window.indexedDB) {
      window.alert("Your browser doesn't support IndexedDB hence this feature will not be available.");
      return;
    }
    let open = indexedDB.open("RestaurantsRevDB", idb_version);

    open.onsuccess = function () {
      let db = open.result;
      let tx = db.transaction("ResturantStore", "readwrite");
      let rwtx = db.transaction("reviews", "readwrite");
      let lcdtx = db.transaction("localdata", "readwrite");
      let store = tx.objectStore("ResturantStore");
      let reviews = rwtx.objectStore("reviews");
      let localdata = lcdtx.objectStore("localdata");

      let getData = store.getAll();
      let getRev = reviews.getAll();
      let getlcd = localdata.getAll();

      getData.onsuccess = function () {
        callback(null, getData.result);
      }

      getRev.onsuccess = function () {
        callback(null, getRev.result);
      }

      getlcd.onsuccess = function () {
        callback(null, getlcd.result);
      }

      tx.oncomplete = function () {
        db.close();
      };
      rwtx.oncomplete = function () {
        db.close();
      };
      lcdtx.oncomplete = function () {
        db.close();
      };
    }
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    if (navigator.onLine) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', DBHelper.DATABASE_URL + 'restaurants');
      xhr.onload = () => {
        if (xhr.status === 200) { // Got a success response from server!
          const restaurants = JSON.parse(xhr.responseText);
          DBHelper.IDBCreate(restaurants);
          callback(null, restaurants);
        } else { // Oops!. Got an error from server.
          const error = (`Request failed. Returned status of ${xhr.status}`);
          callback(error, null);
        }
      };
      xhr.send();
    }else{
      console.log('no internet / offline mode hence Using Cached data!');
      DBHelper.getCachedData((error, restaurants) => {
        if (restaurants.length > 0) {
          console.log('Unable to fetch data from server.');
          callback(null, restaurants);
        }
      });
    }

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}-lessres.jpg`);
  }

  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.name}`);
  }

  static viewRestaurantButtonName(restaurant) {
    return (`View Details Of ${restaurant.name}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static fetchReviewsFromServer(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL + 'reviews?limit=-1');
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const reviews = JSON.parse(xhr.responseText);
        let idb = indexedDB.open("RestaurantsRevDB", idb_version);
        idb.onsuccess = function () {
          let db = idb.result;
          // let reviews = db.createObjectStore("reviews", { keyPath: "id" });
          const tx = db.transaction('reviews', 'readwrite');
          const keyvalStore = tx.objectStore('reviews')
          for (const r of reviews) {
            keyvalStore.put(r);
          }
        }
        if(callback!=null){
          callback(null, reviews);
        }
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  static fetchReviews(callback) {
    let idb = indexedDB.open("RestaurantsRevDB", idb_version);
    idb.onsuccess = function () {
      let db = idb.result;
      const tx = db.transaction('reviews', 'readwrite');
      const keyvalStore = tx.objectStore('reviews');
      // keyvalStore.getAll().then(
        // function(vals) {
          if (keyvalStore.length > 0){
            callback(null, keyvalStore);
          }
          else{
            DBHelper.fetchReviewsFromServer(callback);
          }
        // }
      // );
    }
  }

  /**
   * Fetch a restaurant's reviews by its ID.
   */
  static fetchReviewsById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const theseReviews = reviews.filter(r => r.restaurant_id == id);
          callback(null, theseReviews);
      }
    });
  }

  /**
   * Save a new review to IndexedDB
   */
  static cacheNewReview(review) {
    let idb = indexedDB.open("RestaurantsRevDB", idb_version);
    return idb.onsuccess = function () {
      let db = idb.result;
      const tx = db.transaction('reviews', 'readwrite');
      const keyvalStore = tx.objectStore('reviews');
      return keyvalStore.put(review);
    }
  }

  /**
   * Add an unsynced review to IndexedDB to be sent to server on next reload
   */
  static queueNewReview(review) {
    let idb = indexedDB.open("RestaurantsRevDB", idb_version);
    return idb.onsuccess = function () {
      let db = idb.result;
      const tx = db.transaction('localdata', 'readwrite');
      const keyvalStore = tx.objectStore('localdata');
      return keyvalStore.put(review);
    }
  }

  /**
   * Send review to server
   */ 
  static sendUpdate(data, fresh=true){
    const XHR = new XMLHttpRequest();
    XHR.addEventListener("load", function(event) {
      if (!fresh) DBHelper.deleteLocalUpdate(data.id);
    });
    XHR.addEventListener("error", function(event) {
      if (fresh) DBHelper.queueNewReview(createReviewObject(data));
    });
    XHR.open("POST", DBHelper.DATABASE_URL + 'reviews');
    if (!fresh) {
      //delete data['id'];
      XHR.send(JSON.stringify(data, ['name', 'rating', 'restaurant_id', 'comments']));
    }
    else XHR.send(data);
  }

  /**
   * Sync localData key-value store (on reload or online)
   */ 
  static idbSync(){
    let idb = indexedDB.open("RestaurantsRevDB", idb_version);
    idb.onsuccess = function () {
      let db = idb.result;
      const tx = db.transaction('localdata', 'readwrite');
      const keyvalStore = tx.objectStore('localdata');
      keyvalStore.getAll().then(
        function(vals) {
          for (const v of vals) {
            DBHelper.sendUpdate(
              {
                id: v.id,
                restaurant_id: v.restaurant_id,
                name: v.name,
                rating: v.rating,
                comments: v.comments
              }, false
            );
          }
        }
      );
    }
  }

  /**
   * Delete review from localdata key-val store
   */ 
  static deleteLocalUpdate(id){
    let idb = indexedDB.open("RestaurantsRevDB", idb_version);
    idb.onsuccess = function () {
      let db = idb.result;
      const tx = db.transaction('localdata', 'readwrite');
      const keyvalStore = tx.objectStore('localdata');
      keyvalStore.delete(id);
      return tx.complete;
    }
  }

  /**
   * Toggle favourite
   */ 
  static toggleFavourite(callback, id, toggle='true'){
    const XHR = new XMLHttpRequest();
    XHR.addEventListener("load", function(event) {
      callback()
    });
    XHR.addEventListener("error", function(event) {
      
    });
    XHR.open("PUT", DBHelper.DATABASE_URL + `restaurants/${id}/?is_favorite=${toggle}`);
    XHR.send();
  }
}

