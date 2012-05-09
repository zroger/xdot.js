(function($, glob) {

  var DemoFiles = {
    cluster: {
      file: 'demo/examples/cluster.gv.xdot',
      name: 'Cluster',
      url: 'http://www.graphviz.org/content/cluster'
    },
    crazy: {
      file: 'demo/examples/crazy.gv.xdot',
      name: 'Crazy',
      url: 'http://www.graphviz.org/content/crazy'
    },
    datastruct: {
      file: 'demo/examples/datastruct.gv.xdot',
      name: 'Data Structures',
      url: 'http://www.graphviz.org/content/datastruct'
    },
    fsm: {
      file: 'demo/examples/fsm.gv.xdot',
      name: 'Finite Automation',
      url: 'http://www.graphviz.org/content/fsm'
    },
    genetic: {
      file: 'demo/examples/Genetic_Programming.gv.xdot',
      name: 'Genetic Programming',
      url: 'http://www.graphviz.org/content/Genetic_Programming'
    },
    lion_share: {
      file: 'demo/examples/lion_share.gv.xdot',
      name: 'Lion Share',
      url: 'http://www.graphviz.org/content/lion_share'
    },
    profile: {
      file: 'demo/examples/profile.gv.xdot',
      name: 'Program Profile',
      url: 'http://www.graphviz.org/content/profile'
    },
    // TODO: this is not working.
    psg: {
      file: 'demo/examples/psg.gv.xdot',
      name: 'PSG',
      url: 'http://www.graphviz.org/content/psg'
    },
    sdh: {
      file: 'demo/examples/sdh.gv.xdot',
      name: 'Synchronous Digital Heirarchy Stack',
      url: 'http://www.graphviz.org/content/sdh'
    },
    siblings: {
      file: 'demo/examples/siblings.gv.xdot',
      name: 'Siblings',
      url: 'http://www.graphviz.org/content/siblings'
    },
    switch: {
      file: 'demo/examples/switch.gv.xdot',
      name: 'Switch Network',
      url: 'http://www.graphviz.org/content/switch'
    },
    traffic_lights: {
      file: 'demo/examples/traffic_lights.gv.xdot',
      name: 'Traffic Lights',
      url: 'http://www.graphviz.org/content/traffic_lights'
    },
    unix: {
      file: 'demo/examples/unix.gv.xdot',
      name: 'Unix Family Tree',
      url: 'http://www.graphviz.org/content/unix'
    },
    world: {
      file: 'demo/examples/world.gv.xdot',
      name: 'World Dynamics',
      url: 'http://www.graphviz.org/content/world'
    },
    twopi2: {
      file: 'demo/examples/twopi2.gv.xdot',
      name: 'Radial Layout',
      url: 'http://www.graphviz.org/content/twopi2'
    },
    er: {
      file: 'demo/examples/ER.gv.xdot',
      name: 'Entity Relation',
      url: 'http://www.graphviz.org/content/ER'
    },
    philo: {
      file: 'demo/examples/philo.gv.xdot',
      name: 'Philosophers Dilemma',
      url: 'http://www.graphviz.org/content/philo'
    },
    process: {
      file: 'demo/examples/process.gv.xdot',
      name: 'Process',
      url: 'http://www.graphviz.org/content/process'
    },
    softmaint: {
      file: 'demo/examples/softmaint.gv.xdot',
      name: 'Module Dependencies',
      url: 'http://www.graphviz.org/content/softmaint'
    },
    transparency: {
      file: 'demo/examples/transparency.gv.xdot',
      name: 'Partially Transparent Colors',
      url: 'http://www.graphviz.org/content/transparency'
    },
    // TODO: update layout using sfdp.
    root: {
      file: 'demo/examples/root.gv.xdot',
      name: 'Large graph layout using sfdp',
      url: 'http://www.graphviz.org/content/root'
    },
    // TODO: not working.
    gd_1994_2007: {
      file: 'demo/examples/gd_1994_2007.gv.xdot',
      name: 'Cluster relations using gvmap',
      url: 'http://www.graphviz.org/Gallery/undirected/gd_1994_2007.html'
    },
    networkmap_twopi: {
      file: 'demo/examples/networkmap_twopi.gv.xdot',
      name: 'Radial Layout of a Network Graph',
      url: 'http://www.graphviz.org/Gallery/undirected/networkmap_twopi.html'
    }
  };

  var Demo = {};
  
  Demo.zoom = function(zoom) {
    var multiplier;
    multiplier = 1.0 - (zoom / 10);

    graphPaper.zoomLevel = zoom;
    graphPaper.setViewBox(0, 0, 
      graphPaper.width * multiplier,
      graphPaper.height * multiplier);
  };

  Demo.zoomIn = function() {
    Demo.zoom(graphPaper.zoomLevel + 1);
  };
  Demo.zoomOut = function() {
    Demo.zoom(graphPaper.zoomLevel - 1);
  };

  Demo.resizeContainer = function() {
    var $el = $('#demo-container'),
      w = $el.width(),
      h = $(window).height() - $el.position().top - 2;
    $el.height(h);
    
    if (glob.graphPaper) {
      graphPaper.setSize(w, h);
    }
  };

  $(function() {
    $(window).resize(Demo.resizeContainer).resize();

    jQuery.each(DemoFiles, function(key, data) {
      $('#demo-select').append('<option value="' + key + '">' + data.name + '</option>');
    });

    $('#graph-controls .zoom-in').click(function(){
      Demo.zoomIn();
      return false;
    });
    $('#graph-controls .zoom-out').click(function(){
      Demo.zoomOut();
      return false;
    });
    
    

    $('#demo-select').change(function(e) {
      var val = $(this).val();
      var example = DemoFiles[val];

      $('#demo-display').empty();
      $('.demo-info').hide();
      $('#graph-controls').hide();

      if (!example) {
        return;
      }
      
      $('.demo-title').text(example.name);
      $('.demo-source').attr('href', example.url);
      $('.demo-info').show();
      
      $('#demo-container').addClass('loading');
      $.get(example.file, function(text) {
        var parser = new XDotParser(text);
        var graph = parser.parse();
        var graphPaper = Raphael('demo-display', $('#demo-display').width(), $('#demo-display').height());

        graph.draw(graphPaper);
        graphPaper.zoomLevel = 0;

        glob.graphPaper = graphPaper;
        glob.graph = graph;
        
        $('#demo-container').removeClass('loading');
        $('#graph-controls').show();
      });
    });
  });

})(jQuery, this);
