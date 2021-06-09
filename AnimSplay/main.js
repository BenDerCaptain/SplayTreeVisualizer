let nodesToGenerate = 15;
let tree;
let animationSpeed = 1.0;
let animationType;
let rotation_data = [];

function init(){
    initSVG(1000,1000);
    updateNavbarButtons();

    test1()
    //test2()

}

function test1(){
    tree = new SplayTree(15);
    createSVGTree(tree)
}

function test2(){
    SelectedSource = 6;
    SelectedDestination = 4;
    animationType = "auto"
    checkSelected()
}

function generateTree(){
    nodesToGenerate = $("#nodeCount").prop('value');

    if (nodesToGenerate === "")
        nodesToGenerate = $("#nodeCount").prop('placeholder');

    if (nodesToGenerate < 0)
        return;

    tree = new SplayTree(nodesToGenerate);
    createSVGTree(tree)
}

function saveTree(){
    //TODO
    //console.log("save")
}

function loadTree(){
    //TODO
    //console.log("load")
}

function resetTree(){

    finish_animation()
    tree = new SplayTree(nodesToGenerate);
    //console.log(nodesToGenerate)
    createSVGTree(tree)
}

function changeSpeed(){
    //TODO
    console.log("changeSpeed")
}

function startAnimationPipeline(){
    // TODO
    // 1.rotate datasource
    // 2.
    //
    //Zig has a hard bug which deletes nodes from the tree on some rotations!!
    console.log("start animation")

    //Get nodes from selected
    let sourceNode = tree.getNodeByValue(parseInt(getSelectedSource()))
    let destinationNode = tree.getNodeByValue(parseInt(getSelectedDestination()))

    //console.log(sourceNode)
    //console.log(destinationNode)

    // Detect Common ancestor
    // Mark Common ancestor
    let commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode)
    //console.log(commonAncestor)

    // Loop Until source node in ancestor spot
    //console.log("Step sourceNode")
    while(tree.getCommonAncestor(sourceNode,destinationNode) !== sourceNode){
        nextAnimationStep(sourceNode, commonAncestor)
        return;
        //createSVGTree(tree)
    }

    // Loop Until dest node child of source node
    //console.log("Step destinationNode")
    while(!tree.isChild(sourceNode,destinationNode)){
        if(SplayNode.greater(sourceNode, destinationNode)){
            nextAnimationStep(destinationNode, sourceNode.leftChild)
        }else if(SplayNode.greater(destinationNode, sourceNode)){
            nextAnimationStep(destinationNode, sourceNode.rightChild)
        }
        //createSVGTree(tree)
    }

    //Finished message
    //Unmark common ancestor
    //Unselect selected Nodes
    //Log communication

    //Redraw <- Only for no animation!
    //createSVGTree(tree)


    console.log("fin animation")
    finish_animation()
    //tree.printOut()

}

function animate(){


}

async function nextAnimationStep(rootNode, targetNode) {
    //console.log("nextStep")

    ////// Detect Step
    let step = tree.getNextRotationStep(rootNode, targetNode)
    console.log(step)
    ////// Log Step
    ////// Execute Step
    if (step !== "DONE") {
        stepAnimation(step, rootNode);
        tree.rotate(step, rootNode);
    }

}

function updateNavbarButtons(){
    animationType = $("#animationTypeSelection").prop('value')
    switch (animationType){
        case "auto":
            $("#startAnimation").css('display',"none")
            $("#stepAnimation").css('display', "none")
            break;
        case "flow":
            $("#startAnimation").css('display',"block")
            $("#stepAnimation").css('display', "none")
            break;
        case "step":
            $("#startAnimation").css('display',"block")
            $("#stepAnimation").css('display', "none")
            break;
    }
}


function checkSelected(){

    if(getSelectedSource() === -1 || getSelectedDestination() === -1){
        //console.log("node-value")
        reset()
    }

    $("#SourceText").text("Source : " + getSelectedSource())
    $("#DestinationText").text("Destination : " + getSelectedDestination())

    if(animationType === "auto") startAnimationPipeline();
}
