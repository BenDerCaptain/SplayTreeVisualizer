//Setup Values
let draw;
let width;
let height;
let CIRCLE_DIAMETER = 20;
let MARGIN_TOP = 20;

//Used Coloring Schema
let COLOR_NODE_BASE = '#00278B';
let COLOR_NODE_ANIMATED = '#6c92ff';
let COLOR_NODE_SELECTED = '#aa8910';
let COLOR_NODE_LCA = '#ce5610';
let COLOR_LINE_BASE = '#cdcdcd';
let COLOR_LINE_COMMUNICATION = '#19b81a';
let COLOR_LINE_PATH = '#d22222';
let COLOR_NODE_BORDER = '#0a0f15';
let COLOR_NODE_HOVER = '#ea1212';
let COLOR_TEXT_BASE = '#ffffff';
let COLOR_TEXT_HOVER ='#ffffff';

//SelectionValues And communication Line
let SelectedSource = -1;
let SelectedDestination = -1;

let x_pos_src_communication_line = 0;
let y_pos_src_communication_line = 0;
let x_pos_dest_communication_line = 0;
let y_pos_dest_communication_line = 0;

let is_drawing = false;

//Pan and zoom values
let def_panButton = 2;
let def_zoomFactor = 0.25;
let def_zoomMin = 0.1;
let def_zoomMax = 5;
let def_defaultZoom = 1;
let def_currentZoom = def_defaultZoom;

let pointZoomOn = false;

//Init tree
function initSVG(heightVal, widthVal){
    width = widthVal;
    height = heightVal;
    let svg = SVG()
        .addTo('#SVGContainer')
        .panZoom({panButton: def_panButton, wheelZoom: false, zoomFactor: def_zoomFactor, zoomMin:def_zoomMin, zoomMax:def_zoomMax})
        .id("SVGViewbox");
    draw = svg.viewbox(0, 0, width, height);

    draw.on('mousemove', redraw_line)
        .on('mouseup', stop_redraw_line)

    draw.on('wheel', zoom);
}

function createSVGTree(splayTree){
    draw.clear();
    let lineGroup = draw.group().id("lineGroup");
    let nodeGroup = draw.group().id("nodeGroup");
    let textGroup = draw.group().id("textGroup");
    build_nodes(nodeGroup, textGroup, width/2.0, width/2.0, 0, splayTree.root);
    create_lines(lineGroup, width/2.0, width/2.0, 0, splayTree.root);
}

function build_nodes(nodeGroup, textGroup, x_position, half_width, y_level, node){
    let circle = nodeGroup
        .circle(CIRCLE_DIAMETER)
        .center(x_position, y_level*CIRCLE_DIAMETER*5+(MARGIN_TOP))
        .id("node_"+node.value.toString())
        .attr("node-value", node.value.toString())
        .fill(COLOR_NODE_BASE)
        .on('mousedown', selectSource)
        .on('mouseup', selectDestination)
        .on('mouseover', mouseOver)
        .on('mouseout', mouseOut);
    circle.stroke(COLOR_NODE_BORDER);
    circle.attr("stroke-width",0);

    let text = textGroup
        .text(node.value.toString())
        .font({fill: COLOR_TEXT_BASE, family: 'Calibri', size: 15 })
        .center(x_position, y_level*CIRCLE_DIAMETER*5+(MARGIN_TOP))
        .id("node_"+node.value.toString()+"_text")
        .css("pointer-events", "none");

    if(node.leftChild !== null)
        build_nodes(nodeGroup, textGroup, x_position - (half_width/2.), half_width/2., y_level+1, node.leftChild);


    if(node.rightChild !== null)
        build_nodes(nodeGroup, textGroup, x_position + (half_width/2.), half_width/2., y_level+1, node.rightChild);

}

function create_lines(lineGroup, x_position, half_width, y_level, node){
    if(node.leftChild !== null){
        let line = lineGroup
            .line(x_position, y_level*CIRCLE_DIAMETER*5+MARGIN_TOP, x_position - (half_width/2.), (y_level+1)*CIRCLE_DIAMETER*5+MARGIN_TOP)
            .id("connector_"+node.value.toString()+"_"+node.leftChild.value.toString());
        line.stroke({ color: COLOR_LINE_BASE, width: 3});
        create_lines(lineGroup, x_position - (half_width/2.), half_width/2., y_level+1, node.leftChild);
    }

    if(node.rightChild !== null){
        let line = lineGroup
            .line(x_position, y_level*CIRCLE_DIAMETER*5+MARGIN_TOP, x_position + (half_width/2.), (y_level+1)*CIRCLE_DIAMETER*5+MARGIN_TOP)
            .id("connector_"+node.value.toString()+"_"+node.rightChild.value.toString());
        line.stroke({ color: COLOR_LINE_BASE, width: 3});
        create_lines(lineGroup, x_position + (half_width/2.), half_width/2., y_level+1, node.rightChild);
    }
}


//Events

//// Source Selection
function selectSource(event){
    if(event.button !== 0) return;

    is_drawing = true;
    reset();
    SelectedSource = this.attr("node-value");
    this.attr('fill', COLOR_NODE_SELECTED);

    x_pos_src_communication_line = this.cx();
    y_pos_src_communication_line = this.cy();
    x_pos_dest_communication_line = this.cx();
    y_pos_dest_communication_line = this.cy();
}

function getSelectedSource(){
    return SelectedSource;
}

//// Destination Selection
function selectDestination(event){
    if(event.button !== 0) return;
    is_drawing = false;
    SelectedDestination = this.attr("node-value");
    this.attr('fill', COLOR_NODE_SELECTED);
    x_pos_dest_communication_line = this.cx();
    y_pos_dest_communication_line = this.cy();
    draw_communication_line();
}

function getSelectedDestination(){
    return SelectedDestination;
}

////Zoom handling
function zoom(event){
    event.preventDefault();
    let factor = event.deltaY >= 0? -1:1;
    def_currentZoom += factor * def_zoomFactor * def_currentZoom;
    if(def_currentZoom >= def_zoomMax) def_currentZoom = def_zoomMax;
    else if(def_currentZoom <=def_zoomMin) def_currentZoom = def_zoomMin;

    if(pointZoomOn){
        let point = draw.point(event.x, event.y)
        draw.zoom(def_currentZoom, {x: point.x ,y: point.y})
    }
    else{
        draw.zoom(def_currentZoom);
    }
}

function resetZoomLevel(){
    def_currentZoom = def_defaultZoom;
    draw.zoom(def_currentZoom);
}

////Change nodes appearence on mouse over
function mouseOver(){
    this.fill(COLOR_NODE_HOVER);
    this.size(25);

    let node_value = this.attr("node-value")
    let hovered_text = SVG("#node_"+node_value+"_text")
    hovered_text.font({weight:"bold", fill:COLOR_TEXT_HOVER});

}

////Reset nodes appearance to before mouse-enter event
function mouseOut(){
    let nodeValue = this.attr("node-value")
    if(nodeValue === SelectedSource ||nodeValue === SelectedDestination){
        this.fill(COLOR_NODE_SELECTED)
    }else{
        this.fill(COLOR_NODE_BASE);
    }
    this.size(20);

    let node_value = this.attr("node-value")
    let hovered_text = SVG("#node_"+node_value+"_text")
    hovered_text.font({weight:"normal", fill:COLOR_TEXT_BASE});
}

////Communication line continuous drawing
function redraw_line(event){
    if(!is_drawing) return;
    let point = draw.point(event.x, event.y)

    x_pos_dest_communication_line = point.x;
    y_pos_dest_communication_line = point.y;
    draw_communication_line();
}

////Stop continuous drawing when mouse is not pressed
function stop_redraw_line(event){
    if(event.button !== 0) return;
    is_drawing = false
}

//Visualization Support Function

////Rebuild Connector lines
function instant_rebuild_lines(tree){
    let lines_group_node = SVG("#lineGroup");
    lines_group_node.children().forEach(child => child.remove());
    create_lines(lines_group_node, width/2.0, width/2.0, 0, tree.root);
}

////Reset Selected Source and Destination
function reset(){
    delete_communication_line();
    let src_node = '#node_'+SelectedSource;
    let dest_node = '#node_'+SelectedDestination;
    reset_node_color(SVG(src_node))
    reset_node_color(SVG(dest_node))

    SelectedSource = "-";
    SelectedDestination = "-";
}

function reset_node_color(node){
    if(node !== null)
        node.attr('fill', COLOR_NODE_BASE)
}

//Center Tree in SVG on reset tree click
function resetTreeToCenter(){
    let svg = SVG("#SVGViewbox");
    let size = draw.node.viewBox.baseVal;
    let half_width = size.width / 2.0;
    let half_height = size.height / 2.0;

    let innerBBox = SVG("#nodeGroup").bbox();
    let inner_half_height = innerBBox.height / 2.0;
    //take exact half of width == 1000/2
    let width_diff = (500 - half_width) ;
    //add margin times two (top/bot)
    let height_diff = (inner_half_height - half_height) +40;

    let box = new SVG.Box(width_diff , height_diff, size.width, size.height)
    svg.viewbox(box)
}

////draw static communication line after selection
function draw_communication_line(){
    let line = SVG("#comm_line")
    if(line === null){
        let lines = SVG("#lineGroup")
        lines
            .line(x_pos_src_communication_line,
                y_pos_src_communication_line,
                x_pos_dest_communication_line,
                y_pos_dest_communication_line)
            .id("comm_line")
            .stroke({ color: COLOR_LINE_COMMUNICATION, width: 6});
    }else{
        line.attr({ x1:x_pos_src_communication_line,
            y1: y_pos_src_communication_line,
            x2:x_pos_dest_communication_line,
            y2: y_pos_dest_communication_line});
    }
}

////delete static communication line before animation
function delete_communication_line(){
    let line = SVG("#comm_line");
    if(line !== null)
        line.remove();
}

////Disable Mouse events when animating
function disableNodeMouseEvents(){
    let nodeGroup = SVG("#nodeGroup");
    nodeGroup.children().forEach(child => child.css("pointer-events", "none"));
}

////Enable mouse events when animation finished
function enableNodeMouseEvents(){
    let nodeGroup = SVG("#nodeGroup");
    nodeGroup.children().forEach(child => child.css("pointer-events", "visiblePainted"));
}


//Animation Code
let timeline = new SVG.Timeline();
let animation_speed = 1;
let start_time = 0;

function set_timeline_speed(new_speed){
    animation_speed = new_speed;
    timeline.speed(animation_speed);
}

function stepAnimation(step, sourceNode) {

    //setup timeline

    let is_left_child = (sourceNode.parent.leftChild === sourceNode);
    switch(step){
        case "ZIG":
            if(is_left_child)
                start_time = zig(sourceNode, timeline, start_time);
            else
                start_time = zag(sourceNode, timeline, start_time);

            break;
        case "ZIGZIG":
            if(is_left_child)
                start_time = zigzig(sourceNode, timeline, start_time);
            else
                start_time = zagzag(sourceNode, timeline, start_time);

            break;
        case "ZIGZAG":
            if(is_left_child)
                start_time = zigzag(sourceNode, timeline, start_time);
            else
                start_time = zagzig(sourceNode, timeline, start_time);

            break;
    }

    const animation_finished_event = new Event('animation_finished');
    let done_runner = new SVG.Runner();
    done_runner.timeline(timeline);
    done_runner.animate(1, start_time, "absolute")
        .after(function (){
            dispatchEvent(animation_finished_event);
        });
}

function finish_animation(){
    timeline = new SVG.Timeline();
    timeline.speed(animation_speed);
    start_time = 0;
}

//Highlighting
function highlight_route(srcNode, destNode, commonAncestor){
    let lineList = get_lines_from_nodes(srcNode, destNode, commonAncestor);

    lineList.forEach(function (line_id){
        let line = SVG(line_id)
        line.timeline(timeline)
        line.animate(1000, start_time, "absolute" ).stroke({ color: COLOR_LINE_PATH, width: 4});
    })

    start_time += 1000;

    const route_detection_finished_event = new Event('route_detection_finished');
    let done_runner = new SVG.Runner();
    done_runner.timeline(timeline);
    done_runner.animate(1, start_time, "absolute")
        .after(function (){
            dispatchEvent(route_detection_finished_event);
        });

}

function remove_route_highlight(srcNode, destNode, commonAncestor){

    let lineList = get_lines_from_nodes(srcNode, destNode, commonAncestor);

    lineList.forEach(function (line_id){
        let line = SVG(line_id)
        line.timeline(timeline)
        line.animate(1000, start_time, "absolute" ).stroke({ color: COLOR_LINE_BASE, width: 3});
    })

}

function get_lines_from_nodes(srcNode, destNode, commonAncestor){
    let nodeList = [srcNode, destNode];
    let lineList = [];
    for(let i=0; i<2; i++){
        let currentNode = nodeList[i]
        while(!SplayNode.equals(currentNode, commonAncestor)){
            let parent = currentNode.parent;
            let line = "#connector_"+parent.value+"_"+currentNode.value;
            lineList.push(line)
            currentNode = parent;
        }
    }
    return lineList;
}
function change_highlight_from_route_to_lca(srcNode, destNode, commonAncestor){
    remove_route_highlight(srcNode, destNode, commonAncestor)

    let lca_id = "#node_"+commonAncestor.value;
    let lca_node = SVG(lca_id)

    lca_node.timeline(timeline)
    lca_node.animate(1000, start_time, "absolute").attr({fill: COLOR_NODE_LCA});

    start_time += 1000;
    const lca_detection_finished_event = new Event('lca_detection_finished');
    let done_runner = new SVG.Runner();
    done_runner.timeline(timeline);
    done_runner.animate(1, start_time, "absolute")
        .after(function (){
            dispatchEvent(lca_detection_finished_event);
        });
}

function remove_lca_highlight(commonAncestor){
    let lca_id = "#node_"+commonAncestor.value;
    let lca_node = SVG(lca_id)

    lca_node.attr({fill: COLOR_NODE_BASE});
}

// Zig's Animation code

function zag(nodeToRotate, timeline, start_time) {
    //      x, p... Nodes
    //      A, B, C... Subtrees
    //
    //       p            x
    //      / \          / \
    //     A   x    =   p   C
    //        / \      / \
    //       B   C    A   B
    //

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag x
    //1.1 move x to p (up)
    //1.2 move p to A (down)
    //1.3 move A to p.left (down)
    //1.4 move B to p.right (left)
    //1.5 move C to x.right (up)
    //2. Redraw lines (FIN)
    //
    let destinationNode = nodeToRotate.parent;
    let y_level = destinationNode.level();

    let idSource = "#node_" + nodeToRotate.value;
    let idSource_text = "#node_" + nodeToRotate.value + "_text";

    let idDest = "#node_" + destinationNode.value;
    let idDest_text = "#node_" + destinationNode.value + "_text";

    let nodeToAnimate = SVG(idSource);
    let textToAnimate = SVG(idSource_text);

    //1. Zag x
    let targetNode = SVG(idDest);
    let targetText = SVG(idDest_text);

    //common ancestor positon -> important for all other positionings
    let target_xpos = targetNode.attr("cx");
    let target_ypos = targetNode.attr("cy");

    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //1.2 move p to A (down)
    let left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    let left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = destinationNode.value;
    let value2 = nodeToRotate.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move A to p.left (down)
    let downNode = destinationNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level+2, left_child_xpos, "left");

    //1.4 move B to p.right (left)
    let sideNode = nodeToRotate.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level+2, left_child_xpos, "right");

    //1.5 move C to x.right (up)
    let upNode = nodeToRotate.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level+1, target_xpos, "right");

    //2. Redraw lines (FIN)
    return start_time+1000;
}

function zig(nodeToRotate, timeline, start_time) {
    //      x, p... Nodes
    //      A, B, C... Subtrees
    //
    //         p            x
    //        / \          / \
    //       x   C  =     A   p
    //      / \              / \
    //     A   B            B   C
    //

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig x
    //1.1 move x to p (up)
    //1.2 move p to C (down)
    //1.3 move C to p.right (down)
    //1.4 move B to p.left (right)
    //1.5 move A to x.left (up)
    //2. Redraw lines (FIN)
    //

    let destinationNode = nodeToRotate.parent;
    let y_level = destinationNode.level();

    let idSource = "#node_" + nodeToRotate.value;
    let idSource_text = "#node_" + nodeToRotate.value + "_text";

    let idDest = "#node_" + destinationNode.value;
    let idDest_text = "#node_" + destinationNode.value + "_text";

    let nodeToAnimate = SVG(idSource);
    let textToAnimate = SVG(idSource_text);

    let targetNode = SVG(idDest);
    let targetText = SVG(idDest_text);

    //1. Zig x
    //common ancestor positon -> important for all other positionings
    let target_xpos = targetNode.attr("cx");
    let target_ypos = targetNode.attr("cy");

    //Zig source to target
    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move

    //1.2 move p to C (down)
    let left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    let left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = destinationNode.value;
    let value2 = nodeToRotate.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move C to p.right (down)
    let downNode = destinationNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right");

    //1.4 move B to p.left (right)
    let sideNode = nodeToRotate.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "left");

    //1.5 move A to x.left (up)
    let upNode = nodeToRotate.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left");

    //2. Redraw lines (FIN)
    return start_time+1000;

}

function zagzag(nodeToRotate, timeline, start_time) {

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //      g                       x
    //     / \                     / \
    //    A   p                   p   D
    //       / \       =         / \
    //      B   x               g   C
    //         / \             / \
    //        C   D           A   B

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag p
    //1.1 move p to g (up)
    //1.2 move g to A (down)
    //1.3 move A to g.left (down)
    //1.4 move B to g.right (left)
    //1.5 move x to p.right (up)
    //2. Zag x
    //2.1 move x to p (up)
    //2.2 move p to g (down)
    //2.3 move g to A (down)
    //2.4 move A to g.left (down)
    //2.5 move B to g.right (down)
    //2.6 move C to p.right (left)
    //2.7 move D to x.right (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate;
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //get y level of gp
    let grandparent_y_level = grandParentNode.level();

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let sideNode;
    let upNode;
    let bridgeNode;
    let bridgeText;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zag p

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idParent);
    textToAnimate = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move p to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine y level
    let y_level = grandparent_y_level;

    //1.2 move g to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = grandParentNode.value;
    let value2 = parentNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left");

    //1.4 move B to g.right (left)
    sideNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "righ");

    //1.5 move x to p.right (up)
    upNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right");

    //2. Zag x
    start_time += 1000;

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    bridgeNode = SVG(idParent);
    bridgeText = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //2.2 move p to g (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = parentNode.value;
    value2 = sourceNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.3 move g to A (down)
    let left_lower_child_xpos = left_child_xpos - width / Math.pow(2, (y_level + 2) + 1);
    let left_lower_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(targetNode, targetText, timeline, start_time, left_lower_child_xpos, left_lower_ypos);

    value1 = grandParentNode.value;
    value2 = parentNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_lower_child_xpos, left_lower_ypos, left_child_xpos, left_child_ypos)

    //2.4 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "left");

    //2.5 move B to g.right (down)
    downNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "right");

    //2.6 move C to p.right (left)
    sideNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "right");

    //2.7 move D to x.right (up)
    upNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right");

    //3. Redraw lines (FIN)
    return start_time+1000;

}

function zigzig(nodeToRotate, timeline, start_time) {

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g            x
    //         / \          / \
    //        p   D        A   p
    //       / \      =>      / \
    //      x   C            B   g
    //     / \                  / \
    //    A   B                C   D

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig p
    //1.1 move p to g (up)
    //1.2 move g to D (down)
    //1.3 move D to g.right (down)
    //1.4 move C to g.left (right)
    //1.5 move x to p.left (up)
    //2 Zig x
    //2.1 move x to p (up)
    //2.2 move p to g (down)
    //2.3 move g to D (down)
    //2.4 move D to g.right (down)
    //2.5 move C to g.left (down)
    //2.6 move B to p.left (right)
    //2.7 move A to x.left (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate;
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //get y level of gp
    let grandparent_y_level = grandParentNode.level();

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let sideNode;
    let upNode;
    let bridgeNode;
    let bridgeText;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zig p

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idParent);
    textToAnimate = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move p to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine y level
    let y_level = grandparent_y_level;

    //1.2 move g to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = grandParentNode.value;
    let value2 = parentNode.value;
    rotate_lines(value1, value2,timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right");

    //1.4 move C to g.left (right)
    sideNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "left");

    //1.5 move x to p.left (up)
    upNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left");

    //zig target to destination
    // 2 Zig x
    start_time +=1000;

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    bridgeNode = SVG(idParent);
    bridgeText = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //2.2 move p to g (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = parentNode.value;
    value2 = sourceNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.3 move g to D (down)
    let left_lower_child_xpos = left_child_xpos + width / Math.pow(2, (y_level + 2) + 1);
    let left_lower_ypos = (y_level + 2) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(targetNode, targetText, timeline, start_time, left_lower_child_xpos, left_lower_ypos);

    value1 = grandParentNode.value;
    value2 = parentNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_lower_child_xpos, left_lower_ypos, left_child_xpos, left_child_ypos)

    //2.4 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "right");

    //2.5 move C to g.left (down)
    downNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 3, left_lower_child_xpos, "left");

    //2.6 move B to p.left (right)
    sideNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "left");

    //2.7 move A to x.left (up)
    upNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left");

    //3. Redraw lines (FIN)
    return start_time+1000;

}

function zagzig(nodeToRotate, timeline, start_time) {

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g
    //         / \             x
    //        p   D          /   \
    //       / \      =>    p     g
    //      A   x          / \   / \
    //         / \        A   B C   D
    //        B   C

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zag x
    //1.1 move x to p (up)
    //1.2 move p to A (down)
    //1.3 move A to p.left (down)
    //1.4 move B to p.right (left)
    //1.5 move C to x.right (up)
    //2. Zig x
    //2.1 move x to g (up)
    //2.2 move g to D (down)
    //2.3 move D to g.right (down)
    //2.4 move C to g.left (right)
    //2.5 move p to x.left (up)
    //3. Redraw lines (FIN)


    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate;
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level();
    let parent_y_level = grandparent_y_level + 1;

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let sideNode;
    let upNode;
    let bridgeNode;
    let bridgeText;
    let y_level;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zag x

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    targetNode = SVG(idParent);
    targetText = SVG(idParent_text);

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    y_level = parent_y_level;

    //1.2 move p to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = parentNode.value;
    let value2 = sourceNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move A to p.left (down)
    downNode = parentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left");

    //1.4 move B to p.right (left)
    sideNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "right");

    //1.5 move C to x.right (up)
    upNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "right");

    //zig target to destination
    //2. Zig x
    start_time +=1000;

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    bridgeNode = SVG(idParent);
    bridgeText = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //2.1 move x to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine nodes to move
    y_level = grandparent_y_level;

    //2.2 move g to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = grandParentNode.value;
    value2 = parentNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.3 move D to g.right (down)
    downNode = grandParentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right");

    //2.4 move C to g.left (right)
    sideNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "left");

    //2.5 move p to x.left (up)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = parentNode.value;
    value2 = sourceNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.6 move A to p.left (up)
    upNode = parentNode.leftChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "left");

    //2.7 move B to p.right (up)
    upNode = sourceNode.leftChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "right");

    start_time += 1000;

    //3. Redraw lines (FIN)
    return start_time;
}

function zigzag(nodeToRotate, timeline, start_time) {

    //      x, p, g... Nodes
    //      A, B, C, D... Subtrees
    //
    //          g
    //         / \             x
    //        A   p          /   \
    //           / \    =>  g     p
    //          x   D      / \   / \
    //         / \        A   B C   D
    //        B   C

    //Preorchestrate animation on the current positions
    //execute animations as two zig rotations
    //
    //1. Zig x
    //1.1 move x to p (up)
    //1.2 move p to D (down)
    //1.3 move D to p.right (down)
    //1.4 move C to p.left (right)
    //1.5 move B to x.left (up)
    //2. Zag x
    //2.1 move x to g (up)
    //2.2 move g to A (down)
    //2.3 move A to g.left (down)
    //2.4 move B to g.right (left)
    //2.5 move p to x.right (up)
    //2.6 move D to p.right (up)
    //2.7 move C to p.left (up)
    //3. Redraw lines (FIN)

    //CREATING DATA FIELDS

    let sourceNode = nodeToRotate;
    let parentNode = nodeToRotate.parent;
    let grandParentNode = nodeToRotate.parent.parent;

    //granparent is the highest in the list, so the search is quickest
    let grandparent_y_level = grandParentNode.level();
    let parent_y_level = grandparent_y_level + 1;

    let idSource = "#node_" + sourceNode.value;
    let idSource_text = "#node_" + sourceNode.value + "_text";

    let idParent = "#node_" + parentNode.value;
    let idParent_text = "#node_" + parentNode.value + "_text";

    let idGParent = "#node_" + grandParentNode.value;
    let idGParent_text = "#node_" + grandParentNode.value + "_text";

    /// ANIMATION VALUES DEFINITIONS
    let nodeToAnimate;
    let textToAnimate;
    let targetNode;
    let targetText;
    let target_xpos;
    let target_ypos;
    let left_child_xpos;
    let left_child_ypos;
    let downNode;
    let sideNode;
    let upNode;
    let bridgeNode;
    let bridgeText;
    let y_level;

    /// ANIMATION START

    //Zig parent to destination
    //1. Zig x

    //get nodes to animate (parent, grandparent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    targetNode = SVG(idParent);
    targetText = SVG(idParent_text);

    //target (grandparent) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");

    //1.1 move x to p (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //determine y level
    y_level = parent_y_level;

    //1.2 move p to D (down)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    let value1 = parentNode.value;
    let value2 = sourceNode.value;
    rotate_lines(value1, value2,timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //1.3 move D to p.right (down)
    downNode = parentNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "right");

    //1.4 move C to p.left (right)
    sideNode = sourceNode.rightChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "left");

    //1.5 move B to x.left (up)
    upNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 1, target_xpos, "left");

    //zig target to destination
    //2. Zag x
    start_time +=1000;

    //get nodes to animate (source, parent)
    nodeToAnimate = SVG(idSource);
    textToAnimate = SVG(idSource_text);

    bridgeNode = SVG(idParent);
    bridgeText = SVG(idParent_text);

    targetNode = SVG(idGParent);
    targetText = SVG(idGParent_text);

    //target (still grandparent, since animation didn't play yet) positon -> important for all other positionings
    target_xpos = targetNode.attr("cx");
    target_ypos = targetNode.attr("cy");
    y_level = grandparent_y_level;

    //2.1 move x to g (up)
    start_time = moveTo(nodeToAnimate, textToAnimate, timeline, start_time, target_xpos, target_ypos);

    //2.2 move g to A (down)
    left_child_xpos = target_xpos - width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    start_time = moveTo(targetNode, targetText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = grandParentNode.value;
    value2 = parentNode.value;
    rotate_lines(value1, value2,timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.3 move A to g.left (down)
    downNode = grandParentNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, downNode, y_level + 2, left_child_xpos, "left");

    //2.4 move B to g.right (left)
    sideNode = sourceNode.leftChild;
    start_time = moveSubTree_recursionStart(timeline, start_time, sideNode, y_level + 2, left_child_xpos, "right");

    //2.5 move p to x.right (up)
    left_child_xpos = target_xpos + width / Math.pow(2, (y_level + 1) + 1);
    left_child_ypos = (y_level + 1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);
    moveTo(bridgeNode, bridgeText, timeline, start_time, left_child_xpos, left_child_ypos);

    value1 = parentNode.value;
    value2 = sourceNode.value;
    rotate_lines(value1, value2, timeline, start_time, left_child_xpos, left_child_ypos, target_xpos, target_ypos)

    //2.6 move D to p.right (up)
    upNode = parentNode.rightChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "right");

    //2.7 move C to p.left (up)
    upNode = sourceNode.rightChild;
    moveSubTree_recursionStart(timeline, start_time, upNode, y_level + 2, left_child_xpos, "left");

    start_time += 1000;

    //3. Redraw lines (FIN)
    return start_time;
}

//Sub animations for zigs
function moveSubTree_recursionStart(timeline, start_time, node, y_level, target_xpos,  side = "left" ){
    if (node !== null) {
        let id = "#node_" + node.value;
        let id_text = "#node_" + node.value + "_text";
        let subtree_xpos = target_xpos;
        if(side === "left")
            subtree_xpos -= width / Math.pow(2, y_level + 1);
        else if(side === "right")
            subtree_xpos += width / Math.pow(2, y_level + 1);

        let subtree_ypos = y_level * CIRCLE_DIAMETER * 5 + (MARGIN_TOP);


        let value1 = node.parent.value;
        let value2 = node.value;
        rotate_lines(value1, value2, timeline, start_time, target_xpos, (y_level-1) * CIRCLE_DIAMETER * 5 + (MARGIN_TOP), subtree_xpos, subtree_ypos)


        start_time = moveSubTree(node, SVG(id), SVG(id_text), timeline, start_time, y_level, subtree_xpos, subtree_ypos);

    }

    return start_time;
}

function moveSubTree(node, circle, text, timeline, start_time, y_level, pos_x, pos_y){

    moveTo(circle, text, timeline, start_time, pos_x, pos_y);
    let value1 = node.value;

    //leftChild
    let sideNode = node.leftChild;
    if(sideNode !== null){
        let idLeft = "#node_" + sideNode.value;
        let idLeft_text = "#node_" + sideNode.value + "_text";
        let target_xpos = pos_x - width/Math.pow(2, (y_level+1)+1);
        let target_ypos =(y_level+1)*CIRCLE_DIAMETER*5+(MARGIN_TOP);

        let value2 = sideNode.value;
        rotate_lines(value1, value2, timeline, start_time, pos_x, pos_y, target_xpos, target_ypos)

        moveSubTree(sideNode, SVG(idLeft), SVG(idLeft_text), timeline, start_time, y_level+1, target_xpos, target_ypos);
    }

    //rightChild
    let rightNode = node.rightChild;
    if(rightNode !== null){
        let idRight = "#node_" + rightNode.value;
        let idRight_text = "#node_" + rightNode.value + "_text";
        let target_xpos = pos_x + width/Math.pow(2, (y_level+1)+1);
        let target_ypos =(y_level+1)*CIRCLE_DIAMETER*5+(MARGIN_TOP);

        let value2 = rightNode.value;
        rotate_lines(value1,value2, timeline, start_time, pos_x, pos_y, target_xpos, target_ypos)

        moveSubTree(rightNode, SVG(idRight), SVG(idRight_text), timeline, start_time, y_level+1, target_xpos, target_ypos);
    }

    return start_time;
}

function moveTo(circle, text, timeline, start_time, pos_x, pos_y){

    circle.timeline(timeline);
    text.timeline(timeline);

    //get node color for reset later
    let node_color = circle.attr('fill')

    //One frame change size => change size before movement
    circle.animate(1, start_time, "absolute").size(22).attr({fill: COLOR_NODE_ANIMATED, "stroke-width": 1});

    //move circle => most frames for movement
    circle.animate(998, start_time+1, "absolute" ).center(pos_x, pos_y);
    text.animate(998, start_time+1, "absolute" ).center(pos_x, pos_y);

    //One frame change size
    circle.animate(1, start_time+999, "absolute").size(20).attr({fill: node_color, 'stroke-width': 0});

    return start_time;

}

function rotate_lines(v1, v2, timeline, start_time, pos_x1, pos_y1, pos_x2, pos_y2){

    let connector = "#connector_"+v1+"_"+v2;
    let line = SVG(connector);
    if(line === null){
        connector = "#connector_"+v2+"_"+v1;
        line = SVG(connector);
        if(line === null){
            console.log("ERROR");
            return;
        }
    }


    line.timeline(timeline);

    //move circle => most frames for movement
    line.animate(998, start_time+1, "absolute" ).attr({ x1: pos_x1,
                                                        y1: pos_y1,
                                                        x2: pos_x2,
                                                        y2: pos_y2});

    return start_time;
}