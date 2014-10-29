
 /**
  * Table namespace
  *
  * @see ./demo/defile/table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  * @see ./test/speed/table.html
  *
  * @namespace basis.ui.table
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var getter = basis.getter;
  var nullGetter = basis.fn.nullGetter;
  var extend = basis.object.extend;

  var basisEvent = require('basis.event');
  var Emitter = basisEvent.Emitter;
  var createEvent = basisEvent.create;
  var basisDomWrapper = require('basis.dom.wrapper');
  var GroupingNode = basisDomWrapper.GroupingNode;
  var PartitionNode = basisDomWrapper.PartitionNode;
  var basisUi = require('basis.ui');
  var UINode = basisUi.Node;
  var UIPartitionNode = basisUi.PartitionNode;
  var UIGroupingNode = basisUi.GroupingNode;
  var basisTemplate = require('basis.template');


  //
  // Table header
  //

 /**
  * @class
  */
  var HeaderPartitionNode = Class(UINode, {
    className: namespace + '.HeaderPartitionNode',

    template: module.template('HeaderPartitionNode'),
    binding: {
      title: 'data:',
      colSpan: 'delegate.colSpan'
    },

    listen: {
      delegate: {
        colSpanChanged: function(){
          this.updateBind('colSpan');
        }
      }
    }
  });

 /**
  * @class
  */
  var HeaderGroupingNode = Class(UIGroupingNode, {
    className: namespace + '.HeaderGroupingNode',

   /**
    * @inheritDoc
    */
    childClass: PartitionNode.subclass({
      className: namespace + '.AbstractHeaderPartitionNode',
      colSpan: 1,
      emit_colSpanChanged: createEvent('colSpanChanged'),
      emit_childNodesModified: function(delta){
        PartitionNode.prototype.emit_childNodesModified.call(this, delta);
        this.updateColSpan();
      },
      listen: {
        childNode: {
          colSpanChanged: function(){
            this.updateColSpan();
          }
        }
      },
      updateColSpan: function(){
        var colSpan = this.nodes.reduce(function(res, node){
          return res + (node instanceof HeaderGroupingNode.prototype.childClass ? node.colSpan : 1);
        }, 0);

        if (this.colSpan != colSpan)
        {
          this.colSpan = colSpan;
          this.emit_colSpanChanged();
        }
      }
    }),

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    satellite: {
      partitionRow: {
        dataSource: function(owner){
          return owner.getChildNodesDataset();
        },
<<<<<<< HEAD
        instanceOf: basis.ui.Node.subclass({
          template: module.template('HeaderPartitionRow'),
=======
        instanceOf: UINode.subclass({
          template: templates.HeaderPartitionRow,
>>>>>>> origin/1.4.0
          childClass: HeaderPartitionNode
        })
      }
    },

   /**
    * @inheritDoc
    */
    insertBefore: GroupingNode.prototype.insertBefore,

   /**
    * @inheritDoc
    */
    removeChild: GroupingNode.prototype.removeChild,

   /**
    * @inheritDoc
    */
    syncDomRefs: function(){
      UIGroupingNode.prototype.syncDomRefs.call(this);

      var cursor = this;
      var element = this.owner ? (this.owner.tmpl && this.owner.tmpl.groupRowsElement) || this.owner.childNodesElement : null;

      do
      {
        var rowElement = cursor.satellite.partitionRow.element;

        if (element)
        {
          element.insertBefore(rowElement, element.firstChild);
        }
        else
        {
          if (rowElement.parentNode)
            rowElement.parentNode.removeChild(rowElement);
        }
      }
      while (cursor = cursor.grouping);
    }
  });

 /**
  * @class
  */
  var HeaderCell = Class(UINode, {
    className: namespace + '.HeaderCell',

    colSorting: null,
    defaultOrder: false,
    title: '\xA0',

    template: module.template('HeaderCell'),

    binding: {
      sortable: function(node){
        return node.colSorting ? 'sortable' : '';
      },
      title: function(node){
        return node.title || String(node.title) || '\xA0';
      }
    },

    action: {
      setColumnSorting: function(){
        if (this.selected)
        {
          var owner = this.parentNode && this.parentNode.owner;
          if (owner)
            owner.setSorting(owner.sorting, !owner.sortingDesc);
        }
        else
          this.select();
      }
    },

   /**
    * @inheritDoc
    */
    init: function(){
      this.selectable = !!this.colSorting;

      UINode.prototype.init.call(this);

      if (this.colSorting)
      {
        //this.colSorting = getter(this.colSorting);
        this.defaultOrder = this.defaultOrder == 'desc';
      }
    },

   /**
    * @inheritDoc
    */
    select: function(){
      if (!this.selected)
        this.order = this.defaultOrder;

      UINode.prototype.select.call(this);
    }
  });


 /**
  * @class
  */
  var Header = Class(UINode, {
    className: namespace + '.Header',

    childClass: HeaderCell,
    groupingClass: HeaderGroupingNode,

    template: module.template('Header'),
    binding: {
      order: function(node){
        return node.owner.sortingDesc ? 'desc' : 'asc';
      }
    },

    selection: {},
    listen: {
      owner: {
        sortingChanged: function(owner){
          var cell = basis.array.search(this.childNodes, owner.sorting, 'colSorting');
          if (cell)
          {
            cell.select();
            cell.order = owner.sortingDesc;
          }
          else
            this.selection.clear();

          this.updateBind('order');
        }
      },
      selection: {
        itemsChanged: function(selection){
          var cell = selection.pick();
          if (cell && this.owner)
            this.owner.setSorting(cell.colSorting, cell.order);
        }
      }
    },

    init: function(){
      UINode.prototype.init.call(this);

      if (this.structure)
      {
        var cells = [];
        var autoSorting = [];
        var ownerSorting = this.owner && this.owner.sorting;

        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          var headerConfig = colConfig.header;
          var config = {};

          if (headerConfig == null ||
              typeof headerConfig != 'object' ||
              headerConfig instanceof basis.Token ||
              headerConfig instanceof Emitter)
            headerConfig = {
              title: headerConfig
            };

          if ('groupId' in colConfig)
            config.groupId = colConfig.groupId;

          if ('template' in headerConfig)
            config.template = headerConfig.template;

          if ('title' in headerConfig)
            config.title = headerConfig.title;

          if (typeof config.title == 'function')
            config.title = config.title.call(this);

          // sorting
          var sorting = getter(colConfig.colSorting || colConfig.sorting);

          if (sorting !== nullGetter)
          {
            config.colSorting = sorting;
            config.defaultOrder = colConfig.defaultOrder;

            if (colConfig.autosorting || sorting === ownerSorting)
              autoSorting.push(config);
          }

          // store cell
          cells.push(config);
        }

        if (autoSorting.length)
          autoSorting[0].selected = true;

        this.setChildNodes(cells);
      }
    }
  });


  //
  // Table footer
  //

 /**
  * @class
  */
  var FooterCell = Class(UINode, {
    className: namespace + '.FooterCell',

    value: '',

    template: module.template('FooterCell'),
    binding: {
      colSpan: 'colSpan',
      value: function(node){
        return node.value || String(node.value) || '\xA0';
      }
    },

    colSpan: 1,
    setColSpan: function(colSpan){
      this.colSpan = colSpan || 1;
      this.updateBind('colSpan');
    }
  });

 /**
  * @class
  */
  var Footer = Class(UINode, {
    className: namespace + '.Footer',

    template: module.template('Footer'),

    childClass: FooterCell,

    init: function(){
      UINode.prototype.init.call(this);

      if (this.structure)
      {
        var prevCell = null;
        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          if ('footer' in colConfig)
          {
            var footerConfig = colConfig.footer != null ? colConfig.footer : {};

            if (typeof footerConfig != 'object' ||
                footerConfig instanceof basis.Token ||
                footerConfig instanceof Emitter)
              footerConfig = {
                value: footerConfig
              };

            // fulfill config
            var config = {};

            if ('template' in footerConfig)
              config.value = footerConfig.template;

            if ('value' in footerConfig)
              config.value = footerConfig.value;

            if (typeof config.value == 'function')
              config.value = config.value.call(this);

            if (footerConfig.template)
              config.template = footerConfig.template;

            if (footerConfig.binding)
              config.binding = footerConfig.binding;

            // create instace of cell
            prevCell = this.appendChild(config);
          }
          else
          {
            if (prevCell)
              prevCell.setColSpan(prevCell.colSpan + 1);
            else
              prevCell = this.appendChild({});
          }
        }
      }
    }
  });


  //
  // Table
  //

 /**
  * Base row class
  * @class
  */
  var Row = Class(UINode, {
    className: namespace + '.Row',

    childClass: null,
    repaintCount: 0,

    template: module.template('Row'),

    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select(event.ctrlKey || event.metaKey);
      }
    }
  });

 /**
  * @class
  */
  var Body = Class(UIPartitionNode, {
    className: namespace + '.Body',

    collapsed: false,

    template: module.template('Body'),

    binding: {
      collapsed: function(node){
        return node.collapsed ? 'collapsed' : '';
      }
    },

    action: {
      toggle: function(){
        this.collapsed = !this.collapsed;
        this.updateBind('collapsed');
      }
    }
  });

 /**
  * @class
  */
  var Table = Class(UINode, {
    className: namespace + '.Table',

    template: module.template('Table'),
    binding: {
      header: 'satellite:',
      footer: 'satellite:'
    },

    headerClass: Header,
    footerClass: Footer,

    header: null,
    footer: null,

    columnCount: 0,

    selection: true,
    childClass: Row,

    groupingClass: {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    },

    init: function(){
      var useFooter = false;

      // apply structure config
      if (this.structure)
      {
        var template = '';
        var binding = {};

        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          var cell = colConfig.body || {};

          if ('footer' in colConfig)
            useFooter = true;

          if (typeof cell == 'function' || typeof cell == 'string')
            cell = {
              content: cell
            };

          var content = cell.content;
          var contentType = typeof content;
          var replaceContent = contentType == 'string' ? content : (contentType == 'function' ? '{__cell' + i + '}' : '');
          var cellTemplate = cell.template || '';
          var cellTemplateRef = namespace + '.Cell';

          /** @cut */ if (cell.cssClassName)
          /** @cut */   basis.dev.warn('cssClassName isn\'t supported in body cell config anymore, use template property instead');

          /** @cut */ if (colConfig.cssClassName)
          /** @cut */   basis.dev.warn('cssClassName isn\'t supported for table column config anymore, use template property instead');

          if (cellTemplate)
          {
            if (cellTemplate instanceof basisTemplate.Template)
              cellTemplateRef = '#' + cellTemplate.templateId;
            else
              if (typeof cellTemplate == 'function' && cellTemplate.url)
                cellTemplateRef = cellTemplate.url;
              else
                cellTemplateRef = null;
          }


          template +=
            cellTemplateRef
              ? '<b:include src="' + cellTemplateRef + '">' +
                  (cell.templateRef ? '<b:add-ref name="' + cell.templateRef + '"/>' : '') +
                  (replaceContent
                    ? '<b:replace ref="content">' + replaceContent + '</b:replace>'
                    : '') +
                '</b:include>'
              : cellTemplate; // todo: replace {content} for replaceContent

          if (contentType == 'function')
          {
            binding['__cell' + i] = {
              events: 'update',
              getter: content
            };
          }
        }

        this.columnCount = i;

        this.childClass = this.childClass.subclass({
          template:
            '<b:include src="#' + this.childClass.prototype.template.templateId + '">' +
              '<b:replace ref="cells">' +
                template +
              '</b:replace>' +
            '</b:include>',

          binding: binding
        });
      }

      // inherit
      UINode.prototype.init.call(this);

      // header
      this.header = new this.headerClass(extend({ owner: this, structure: this.structure }, this.header));
      this.setSatellite('header', this.header);

      // footer
      if (useFooter || this.footer)
      {
        this.footer = new this.footerClass(extend({ owner: this, structure: this.structure }, this.footer));
        this.setSatellite('footer', this.footer);
      }
    },

    destroy: function(){
      UINode.prototype.destroy.call(this);

      this.header = null;
      this.footer = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    Table: Table,
    Body: Body,
    Header: Header,
    HeaderCell: HeaderCell,
    Row: Row,
    Footer: Footer
  };
