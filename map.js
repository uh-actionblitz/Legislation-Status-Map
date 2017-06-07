void function ($, _) {
  // because hoisting
  var mymap;
  var geojson;

  mymap = L.map('mapid').setView([42.863,-74.752], 6.55);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoibXJzbmlja2VycyIsImEiOiJjajNjM2ozNmswMDB4MnBzMWh6ZzZnNXQ1In0.HK0L0_LWCcc8Qihk0gNpYg'
  }).addTo(mymap);

  var mapFetch = $.getJSON('data/nys-senatemap.json');
  var senatorStatusFetch = $.getJSON('data/status.json');

  $.when(mapFetch, senatorStatusFetch).then(function(map, s) {
    var senators = s[0];

    //
    //  Map Style
    //
    function colorDistrict(district) {
      var status = senators[district.properties.NAME - 1].status;

      switch(status) {
        case 'FOR':
          return '#1e90ff';
          break;
        case 'AGAINST':
          return '#FF4C50';
          break;
        case 'TARGET':
          return '#CC0004';
          break;
      }
    }

    function style(district) {
      return {
        fillColor: colorDistrict(district),
      };
    }

    //
    //  Map Interaction
    //
    function zoomToFeature (layer) {
      mymap.fitBounds(layer.getBounds());
    }

    function renderBubble (layer) {
      var popup;
      var district = Number(layer.feature.properties.NAME - 1);
      var senator = senators[district];

      var popupTemplate = _.template('\
        <section class=\"senator-image-container\"> \
          <img src=\"<%= imageSrc %>\" /> \
        </section> \
        \
        <section class=\"senator-info\"> \
          <div><%= name %></div> \
          <div>Senate District <%= district %></div> \
          <div class="<%= classname %>"><%= voteStatus %></div>\
        </section> \
        \
        <button class=\"contact-button\">Contact</button> \
      ');

      var content = popupTemplate({
        imageSrc: senator.image,
        name: senator.name,
        district: senator.district,
        classname: (senator.status === 'FOR') ? 'votes-yes' : 'votes-no',
        voteStatus: (senator.status === 'FOR') ? 'Yes' : 'No',
      });

      popup = L.popup({
        closeButton: false,
        className: 'senator-popup',
       });

      popup.setContent(content);

      layer.bindPopup(popup).openPopup();
    }
    
    //
    //  Event Handlers
    //

    function handleClick (e) {
      var layer = e.target;

      renderBubble(layer);
    }

    function onEachFeature(feature, layer) {
      layer.on({
        click: handleClick
      });
    }

    geojson = L.geoJSON(map, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(mymap);
  });

}(window.jQuery, window._) // cover up that scope!
