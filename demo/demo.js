(function($) {

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
    }
  };

  $(function() {
    jQuery.each(DemoFiles, function(key, data) {
      $('#demo-select').append('<option value="' + key + '">' + data.name + '</option>');
    });

    $('#demo-select').change(function(e) {
      var val = $(this).val();
      var example = DemoFiles[val];

      $('#demo-display').empty();
      $('.demo-info').hide();

      if (!example) {
        return;
      }
      
      $('.demo-title').text(example.name);
      $('.demo-source').attr('href', example.url);
      $('.demo-info').show();
      
      $.get(example.file, function(text) {
        var parser = new XDotParser(text);
        var results = parser.parse();
        
        results.draw();
      });
    });
  });

})(jQuery);
