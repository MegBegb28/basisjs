
  var namespace = module.path;

  var getter = basis.getter;
  var getFunctionDescription = require('app.core').getFunctionDescription;
  var getInheritance = require('app.core').getInheritance;
  var Dataset = require('basis.data').Dataset;
  var Node = require('basis.ui').Node;
  var mapDO = require('app.core').mapDO;
  var JsDocEntity = require('app.core').JsDocEntity;
  var ViewOptions = require('app.ext.view').ViewOptions;
  var View = require('app.ext.view').View;
  var PrototypeJsDocPanel = require('app.ext.jsdoc').PrototypeJsDocPanel;

  var PROTOTYPE_ITEM_WEIGHT = {
    'event': 1,
    'property': 2,
    'method': 3
  };

  var PROTOTYPE_ITEM_TITLE = {
    'event': 'Events',
    'property': 'Properties',
    'method': 'Methods'
  };


 /**
  * @class
  */
  var PrototypeItem = Node.subclass({
    className: 'PrototypeProperty',
    nodeType: 'property',

    template: resource('./template/prototypeItem.tmpl'),

    binding: {
      jsdocs: 'satellite:',
      nodeType: 'nodeType',
      title: 'data:key.replace(/^emit_/, "")',
      path: {
        events: 'update',
        getter: function(node){
          return node.host.data.fullPath + '.prototype.' + node.data.key;
        }
      }
    },

    satellite: {
      jsdocs: {
        instance: PrototypeJsDocPanel,
        delegate: function(owner){
          return JsDocEntity.getSlot(owner.data.cls.docsProto_[owner.data.key].path);
        }
      }
    }
  });

  var specialMethod = {
    init: 'constructor',
    destroy: 'destructor'
  };

 /**
  * @class
  */
  var PrototypeMethod = PrototypeItem.subclass({
    className: 'PrototypeMethod',
    nodeType: 'method',
    template: resource('./template/prototypeMethod.tmpl'),

    binding: {
      args: function(node){
        return getFunctionDescription(mapDO[node.data.path].data.obj).args;
      },
      mark: function(node){
        return specialMethod[node.data.key];
      }
    }
  });

 /**
  * @class
  */
  var PrototypeSpecialMethod = PrototypeMethod.subclass({
    className: 'PrototypeSpecialMethod',
    template: resource('./template/prototypeSpecialMethod.tmpl')
  });

 /**
  * @class
  */
  var PrototypeEvent = PrototypeMethod.subclass({
    className: 'PrototypeEvent',
    nodeType: 'event'
  });


  var PROTOTYPE_GROUPING_TYPE = {
    type: 'type',
    rule: 'data.kind',
    sorting: getter('data.id').as(PROTOTYPE_ITEM_WEIGHT),
    childClass: {
      titleGetter: getter('data.id').as(PROTOTYPE_ITEM_TITLE)
    }
  };

  var PROTOTYPE_GROUPING_IMPLEMENTATION = {
    type: 'class',
    rule: function(node){
      //console.log(node.data, node.data.key, node.data.cls.className, mapDO[node.data.cls.className]);
      var key = node.data.key;
      var tag = node.data.tag;
      var cls;
      if (tag == 'override')
      {
        cls = node.data.implementCls;
        if (!cls)
        {
          var cursor = node.data.cls.superClass_;
          while (cursor)
          {
            var cfg = cursor.docsProto_ && cursor.docsProto_[key];
            if (cfg && cfg.tag == 'implement')
            {
              cls = mapDO[cfg.cls.className];
              node.data.implementCls = cls;
              break;
            }
            cursor = cursor.superClass_;
          }
        }
      }
      else
        cls = mapDO[node.data.cls.className];

      return cls || mapDO['basis.Class'];
    },
    sorting: function(group){
      return group.data.obj && group.data.obj.docsLevel_;
    }
  };

 /**
  * @class
  */
  var viewPrototype = new View({
    title: 'Prototype',
    viewHeader: 'Prototype',
    template: resource('./template/prototypeView.tmpl'),

    binding: {
      groupingType: {
        events: 'groupingChanged',
        getter: function(node){
          return node.grouping ? node.grouping.type : '';
        }
      }
    },

    emit_update: function(delta){
      View.prototype.emit_update.call(this, delta);

      if (this.data.obj)
      {
        var d = new Date();

        //console.profile();
        var clsVector = getInheritance(this.data.obj);
        if (!this.clsVector)
          this.clsVector = new Dataset();

        this.clsVector.set(clsVector.map(function(item){
          return mapDO[item.cls.className];
        }));

        this.setChildNodes(
          basis.object
            .values(mapDO[this.data.fullPath].data.obj.docsProto_)
            .map(function(val){
              return {
                data: val,
                host: this
              };
            }, this)
            .filter(Boolean)
        );
        //console.profileEnd();
        console.log('time: ', new Date - d, ' for ', this.childNodes.length);
      }
    },

    childClass: PrototypeItem,
    childFactory: function(config){
      var ChildClass = PrototypeItem;

      switch (config.data.kind)
      {
        case 'event':
          ChildClass = PrototypeEvent;
          break;
        case 'method':
          ChildClass = specialMethod[config.data.key] ? PrototypeSpecialMethod : PrototypeMethod;
          break;
      }

      return new ChildClass(config);
    },

    groupingClass: {
      className: namespace + '.ViewPrototypeGroupingNode',
      childClass: {
        className: namespace + '.ViewPrototypePartitionNode',

        template: resource('./template/prototypeViewGroup.tmpl'),

        binding: {
          groupEmpty: {
            events: 'childNodesModified',
            getter: function(object){
              return object.nodes.length ? '' : 'groupEmpty';
            }
          }
        }
      }
    },

    satellite: {
      viewOptions: {
        instance: ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Type',
                onselect: function(){
                  owner.setSorting('data.key');
                  owner.setGrouping(PROTOTYPE_GROUPING_TYPE);
                }
              },
              {
                title: 'Implementation',
                selected: true,
                onselect: function(){
                  owner.setSorting(function(node){
                    return (PROTOTYPE_ITEM_WEIGHT[node.data.kind] || 0) + '_' + node.data.key;
                  });
                  owner.setGrouping(PROTOTYPE_GROUPING_IMPLEMENTATION);
                }
              }
            ]
          };
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = viewPrototype;
