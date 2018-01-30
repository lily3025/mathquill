/*****************************************
 * Deals with the browser DOM events from
 * interaction with the typist.
 ****************************************/

Controller.open(function(_) {
  _.keystroke = function(key, evt) {
    this.cursor.parent.keystroke(key, evt, this);
  };
});

Node.open(function(_) {
  _.keystroke = function(key, e, ctrlr) {
    var cursor = ctrlr.cursor;

    switch (key) {
    case 'Ctrl-Shift-Backspace':
    case 'Ctrl-Backspace':
      ctrlr.ctrlDeleteDir(L);
      break;

    case 'Shift-Backspace':
    case 'Backspace':
      ctrlr.backspace();
      break;

    // Tab or Esc -> go one block right if it exists, else escape right.
    case 'Esc':
    case 'Tab':
      ctrlr.escapeDir(R, key, e);
      return;

    // Shift-Tab -> go one block left if it exists, else escape left.
    case 'Shift-Tab':
    case 'Shift-Esc':
      ctrlr.escapeDir(L, key, e);
      return;

    // End -> move to the end of the current block.
    case 'End':
      ctrlr.notify('move').cursor.insAtRightEnd(cursor.parent);
      aria.queue("end of").queue(cursor.parent, true);
      break;

    // Ctrl-End -> move all the way to the end of the root block.
    case 'Ctrl-End':
      ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
      aria.queue("end of").queue(ctrlr.ariaLabel).queue(ctrlr.root).queue(ctrlr.ariaPostLabel);
      break;

    // Shift-End -> select to the end of the current block.
    case 'Shift-End':
      while (cursor[R]) {
        ctrlr.selectRight();
      }
      break;

    // Ctrl-Shift-End -> select all the way to the end of the root block.
    case 'Ctrl-Shift-End':
      while (cursor[R] || cursor.parent !== ctrlr.root) {
        ctrlr.selectRight();
      }
      break;

    // Home -> move to the start of the current block.
    case 'Home':
      ctrlr.notify('move').cursor.insAtLeftEnd(cursor.parent);
      aria.queue("beginning of").queue(cursor.parent, true);
      break;

    // Ctrl-Home -> move all the way to the start of the root block.
    case 'Ctrl-Home':
      ctrlr.notify('move').cursor.insAtLeftEnd(ctrlr.root);
      aria.queue("beginning of").queue(ctrlr.ariaLabel).queue(ctrlr.root).queue(ctrlr.ariaPostLabel);
      break;

    // Shift-Home -> select to the start of the current block.
    case 'Shift-Home':
      while (cursor[L]) {
        ctrlr.selectLeft();
      }
      break;

    // Ctrl-Shift-Home -> select all the way to the start of the root block.
    case 'Ctrl-Shift-Home':
      while (cursor[L] || cursor.parent !== ctrlr.root) {
        ctrlr.selectLeft();
      }
      break;

    case 'Left': ctrlr.moveLeft(); break;
    case 'Shift-Left': ctrlr.selectLeft(); break;
    case 'Ctrl-Left': break;

    case 'Right': ctrlr.moveRight(); break;
    case 'Shift-Right': ctrlr.selectRight(); break;
    case 'Ctrl-Right': break;

    case 'Up': ctrlr.moveUp(); break;
    case 'Down': ctrlr.moveDown(); break;

    case 'Shift-Up':
      if (cursor[L]) {
        while (cursor[L]) ctrlr.selectLeft();
      } else {
        ctrlr.selectLeft();
      }

    case 'Shift-Down':
      if (cursor[R]) {
        while (cursor[R]) ctrlr.selectRight();
      }
      else {
        ctrlr.selectRight();
      }

    case 'Ctrl-Up': break;
    case 'Ctrl-Down': break;

    case 'Ctrl-Shift-Del':
    case 'Ctrl-Del':
      ctrlr.ctrlDeleteDir(R);
      break;

    case 'Shift-Del':
    case 'Del':
      ctrlr.deleteForward();
      break;

    case 'Meta-A':
    case 'Ctrl-A':
      ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
      while (cursor[L]) ctrlr.selectLeft();
      break;

    // These remaining hotkeys are only of benefit to people running screen readers.
    case 'Ctrl-Alt-Up': // speak parent block that has focus
      if(cursor.parent.parent && cursor.parent.parent instanceof Node) aria.queue(cursor.parent.parent);
      else aria.queue('nothing above');
      break;

    case 'Ctrl-Alt-Down': // speak current block that has focus
      if(cursor.parent && cursor.parent instanceof Node) aria.queue(cursor.parent);
      else aria.queue('block is empty');
      break;

    case 'Ctrl-Alt-Left': // speak left-adjacent block
      if(cursor.parent.parent.ends[L] && cursor.parent.parent.ends[L] instanceof Node) aria.queue(cursor.parent.parent.ends[L]);
      else aria.queue('nothing to the left');
      break;

    case 'Ctrl-Alt-Right': // speak right-adjacent block
      if(cursor.parent.parent.ends[R] && cursor.parent.parent.ends[R] instanceof Node) aria.queue(cursor.parent.parent.ends[R]);
      else aria.queue('nothing to the right');
      break;

    case 'Ctrl-Alt-Shift-Down': // speak selection
      if(cursor.selection) aria.queue(cursor.selection.join('mathspeak', ' ').trim() + ' selected');
      else aria.queue('nothing selected');
      break;

    case 'Ctrl-Alt-=':
    case 'Ctrl-Alt-Shift-Right': // speak ARIA post label (evaluation or error)
      if(ctrlr.ariaPostLabel.length) aria.queue(ctrlr.ariaPostLabel);
      else aria.queue('no answer');
      break;

    default:
      return;
    }
    aria.alert();
    e.preventDefault();
    ctrlr.scrollHoriz();
  };

  _.moveOutOf = // called by Controller::escapeDir, moveDir
  _.moveTowards = // called by Controller::moveDir
  _.deleteOutOf = // called by Controller::deleteDir
  _.deleteTowards = // called by Controller::deleteDir
  _.unselectInto = // called by Controller::selectDir
  _.selectOutOf = // called by Controller::selectDir
  _.selectTowards = // called by Controller::selectDir
    function() { pray('overridden or never called on this node'); };
});

Controller.open(function(_) {
  this.onNotify(function(e) {
    if (e === 'move' || e === 'upDown') this.show().clearSelection();
  });
  _.escapeDir = function(dir, key, e) {
    prayDirection(dir);
    var cursor = this.cursor;

    // only prevent default of Tab if not in the root editable
    if (cursor.parent !== this.root) e.preventDefault();

    // want to be a noop if in the root editable (in fact, Tab has an unrelated
    // default browser action if so)
    if (cursor.parent === this.root) return;

    cursor.parent.moveOutOf(dir, cursor);
    aria.alert();
    return this.notify('move');
  };

  optionProcessors.leftRightIntoCmdGoes = function(updown) {
    if (updown && updown !== 'up' && updown !== 'down') {
      throw '"up" or "down" required for leftRightIntoCmdGoes option, '
            + 'got "'+updown+'"';
    }
    return updown;
  };
  _.moveDir = function(dir) {
    prayDirection(dir);
    var cursor = this.cursor, updown = cursor.options.leftRightIntoCmdGoes;

    if (cursor.selection) {
      cursor.insDirOf(dir, cursor.selection.ends[dir]);
    }
    else if (cursor[dir]) cursor[dir].moveTowards(dir, cursor, updown);
    else cursor.parent.moveOutOf(dir, cursor, updown);

    return this.notify('move');
  };
  _.moveLeft = function() { return this.moveDir(L); };
  _.moveRight = function() { return this.moveDir(R); };

  /**
   * moveUp and moveDown have almost identical algorithms:
   * - first check left and right, if so insAtLeft/RightEnd of them
   * - else check the parent's 'upOutOf'/'downOutOf' property:
   *   + if it's a function, call it with the cursor as the sole argument and
   *     use the return value as if it were the value of the property
   *   + if it's a Node, jump up or down into it:
   *     - if there is a cached Point in the block, insert there
   *     - else, seekHoriz within the block to the current x-coordinate (to be
   *       as close to directly above/below the current position as possible)
   *   + unless it's exactly `true`, stop bubbling
   */
  _.moveUp = function() { return moveUpDown(this, 'up'); };
  _.moveDown = function() { return moveUpDown(this, 'down'); };
  function moveUpDown(self, dir) {
    var cursor = self.notify('upDown').cursor;
    var dirInto = dir+'Into', dirOutOf = dir+'OutOf';
    if (cursor[R][dirInto]) cursor.insAtLeftEnd(cursor[R][dirInto]);
    else if (cursor[L][dirInto]) cursor.insAtRightEnd(cursor[L][dirInto]);
    else {
      cursor.parent.bubble(function(ancestor) {
        var prop = ancestor[dirOutOf];
        if (prop) {
          if (typeof prop === 'function') prop = ancestor[dirOutOf](cursor);
          if (prop instanceof Node) cursor.jumpUpDown(ancestor, prop);
          if (prop !== true) return false;
        }
      });
    }
    return self;
  }
  this.onNotify(function(e) { if (e !== 'upDown') this.upDownCache = {}; });

  this.onNotify(function(e) { if (e === 'edit') this.show().deleteSelection(); });
  _.deleteDir = function(dir) {
    prayDirection(dir);
    var cursor = this.cursor;
    var cursorEl = cursor[dir], cursorElParent = cursor.parent.parent;
    if(cursorEl && cursorEl instanceof Node) {
      if(cursorEl.sides) {
        aria.queue(cursorEl.parent.chToCmd(cursorEl.sides[-dir].ch).mathspeak({createdLeftOf: cursor}));
      } else if (!cursorEl.blocks && (!cursorEl.text || cursorEl.text.length === 1)) {
        aria.queue(cursorEl);
      }
    } else if(cursorElParent && cursorElParent instanceof Node) {
      if(cursorElParent.sides) {
        aria.queue(cursorElParent.parent.chToCmd(cursorElParent.sides[dir].ch).mathspeak({createdLeftOf: cursor}));
      } else if (cursorElParent.blocks && cursorElParent.mathspeakTemplate) {
        if (cursorElParent.upInto && cursorElParent.downInto) { // likely a fraction, and we just backspaced over the slash
          aria.queue(cursorElParent.mathspeakTemplate[1]);
        } else {
          var mst = cursorElParent.mathspeakTemplate;
          var textToQueue = dir === L ? mst[0] : mst[mst.length - 1];
          aria.queue(textToQueue);
        }
      } else {
        aria.queue(cursorElParent);
      }
    }

    var hadSelection = cursor.selection;
    this.notify('edit'); // deletes selection if present
    if (!hadSelection) {
      if (cursor[dir]) cursor[dir].deleteTowards(dir, cursor);
      else cursor.parent.deleteOutOf(dir, cursor);
    }

    if (cursor[L].siblingDeleted) cursor[L].siblingDeleted(cursor.options, R);
    if (cursor[R].siblingDeleted) cursor[R].siblingDeleted(cursor.options, L);
    cursor.parent.bubble(function (node) { node.reflow(); });

    return this;
  };
  _.ctrlDeleteDir = function(dir) {
    prayDirection(dir);
    var cursor = this.cursor;
    if (!cursor[dir] || cursor.selection) return this.deleteDir(dir);

    this.notify('edit');
    var fragRemoved;
    if (dir === L) {
      fragRemoved = Fragment(cursor.parent.ends[L], cursor[L]);
    } else {
      fragRemoved = Fragment(cursor[R], cursor.parent.ends[R]);
    }
    aria.queue(fragRemoved);
    fragRemoved.remove();

    cursor.insAtDirEnd(dir, cursor.parent);

    if (cursor[L].siblingDeleted) cursor[L].siblingDeleted(cursor.options, R);
    if (cursor[R].siblingDeleted) cursor[R].siblingDeleted(cursor.options, L);
    cursor.parent.bubble(function (node) { node.reflow(); });

    return this;
  };
  _.backspace = function() { return this.deleteDir(L); };
  _.deleteForward = function() { return this.deleteDir(R); };

  this.onNotify(function(e) { if (e !== 'select') this.endSelection(); });
  _.selectDir = function(dir) {
    var cursor = this.notify('select').cursor, seln = cursor.selection;
    prayDirection(dir);

    if (!cursor.anticursor) cursor.startSelection();

    var node = cursor[dir];
    if (node) {
      // "if node we're selecting towards is inside selection (hence retracting)
      // and is on the *far side* of the selection (hence is only node selected)
      // and the anticursor is *inside* that node, not just on the other side"
      if (seln && seln.ends[dir] === node && cursor.anticursor[-dir] !== node) {
        node.unselectInto(dir, cursor);
      }
      else node.selectTowards(dir, cursor);
    }
    else cursor.parent.selectOutOf(dir, cursor);

    cursor.clearSelection();
    cursor.select() || cursor.show();
    if (cursor.selection) aria.clear().queue(cursor.selection.join('mathspeak', ' ').trim() + ' selected'); // clearing first because selection fires several times, and we don't want repeated speech.
  };
  _.selectLeft = function() { return this.selectDir(L); };
  _.selectRight = function() { return this.selectDir(R); };
});
