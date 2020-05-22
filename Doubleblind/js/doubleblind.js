
///////////////////  Constants   /////////////
const Offboard = -3
const AllFactions = -2
const MAX_FACTION_STACKING = 2

const CLEAR = 44
const WOODS = 55
const BUILDINGS = 66
const HILL = 77

///////////////////  Globals   /////////////
var ScenarioName = "McPherson Ridge"
var ScenarioDescription = "The initial phase of Gettysburg."
var AllUnits = []
var MapTerrainElements = []
var FactionName = [ "Unionn", "Confederatess" ]

function MapElement(mapX,mapY,type) {
  this.mapX = mapX;
  this.mapY = mapY;
  this.type = type;
  MapTerrainElements.push( this )
  return this;
}
function getMapElementAt(mapX,mapY) {
  for (var i = 0, li = MapTerrainElements.length; i < li; i++)
  {
	  if(MapTerrainElements[i].mapX == mapX &&
	     MapTerrainElements[i].mapY == mapY)
	  {
	    return MapTerrainElements[i]
	  }
  }
  return undefined
}
function deleteMapElementAt(mapX,mapY) {
  var index = -1
  for (var i = 0, li = MapTerrainElements.length; i < li; i++)
  {
	  if(MapTerrainElements[i].mapX == mapX &&
	     MapTerrainElements[i].mapY == mapY)
	  {
	    index = i
		break;
	  }
  }
  if(i >= 0)
  {
	  MapTerrainElements.splice(i,1)
  }
}

function Unit(name,description,mapX,mapY,faction) {
  this.name = name;
  this.mapX = mapX;
  this.mapY = mapY;
  this.description = description;
  this.faction = faction;
  this.hasMoved = false;
  AllUnits.push( this )
  return this;
}

Unit.prototype.IsAtPosition = function(xMapPos,yMapPos) {
  return (this.mapX == xMapPos && this.mapY == yMapPos)
}

Unit.prototype.MoveTo = function(xMapPos,yMapPos) {
  if(this.hasMoved == false)
  {
	  this.mapX = xMapPos;
	  this.mapY = yMapPos;
	  this.hasMoved = true;
  }
}

Unit.prototype.IsInMovementRange = function(xMapPos,yMapPos) {
	if(this.IsOffboard())
		return true
	if(xMapPos == Offboard && yMapPos == Offboard)
		return true
	if(Math.abs(xMapPos-this.mapX) <= 1
	  && Math.abs(yMapPos-this.mapY) <= 1)
	  return true;
	else
	  return false;
}

Unit.prototype.IsOffboard = function() {
	return this.mapX == Offboard && this.mapY == Offboard;
}

var selectedUnit = undefined  // better in UIControl?



///////////////////  Map  /////////////
// Does NOT have x/y positions - unit position values
// are important. The Map is rerendered every selection/move.

const CELL_WIDTH = 10

function Map(width,height) {
  this.showFaction = 1
  this.width = width
  this.height = height
  this.showRevealedOnly = false
  this.svg = document.getElementById('mainMapContent')//'SVGMap')
  this.ns = 'http://www.w3.org/2000/svg'
  // used to place new units in edit mode
  this.selectPositionMode
  // each faction has its own visibility
  this.visibleSet = [ new Set(), new Set()]
  // visible positions to both => put on table
  this.revealedPosition = new Set()
  return this;
}

Map.prototype.setShowRevealedOnly = function(enable) {
	this.showRevealedOnly = enable
};

Map.prototype.draw = function() {
  // delete old map
  while (this.svg.lastChild) {
    this.svg.removeChild(this.svg.lastChild);
  }
  this.calculateVisibility()
  // draw each position: tile + units as text
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  for (var x = 0, lx = this.width; x < lx; x++)
	  {
		this.drawRect(x,y);
	  }
  }
  // draw sector coordinates at border
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  this.drawSectorOrdinate(-1,y,y+1,CELL_WIDTH/2-1,0);
	  this.drawSectorOrdinate(this.width,y,y+1,-(CELL_WIDTH/2-1),0);
  }
  for (var x = 0, lx = this.width; x < lx; x++)
  {
	  this.drawSectorOrdinate(x,-1,x+1,0,(CELL_WIDTH/2-1));
	  this.drawSectorOrdinate(x,this.height,x+1,0,-(CELL_WIDTH/2-1));
  }
  if(!this.showRevealedOnly)
  {
    if(this.showFaction == AllFactions)
    {
	  this.drawOffboardRect(0)
      this.drawOffboardRect(1)	
    }
	else
	{	
      this.drawOffboardRect(this.showFaction)
	}
  }
};

Map.prototype.posAsString = function(mapX,mapY) {
	return mapX+","+mapY
};

Map.prototype.calculateVisibility = function() {
	this.revealedPosition.clear()
	// calculate for each faction independantly
	for(var faction = 0; faction < FactionName.length; faction++)
	{
		this.visibleSet[faction].clear()
		for (var i = 0, li = AllUnits.length; i < li; i++)
		{
			if(AllUnits[i].faction == faction)
			{
				// add all adjacent positions as strings to the
				// visibility map
				for (var x = -1; x <= 1; x++)
				{
					for (var y = -1; y <= 1; y++)
					{
					  this.visibleSet[faction].add( this.posAsString(
						AllUnits[i].mapX+x,
						AllUnits[i].mapY+y ) )
					}
				}
			}
		}
		// mark enemy positions that are visible
		for (var i = 0, li = AllUnits.length; i < li; i++)
		{
			if(AllUnits[i].faction != faction
			   && this.visibleSet[faction].has(
			   this.posAsString(AllUnits[i].mapX,AllUnits[i].mapY) ) )
			{
			  this.revealedPosition.add( this.posAsString(
				AllUnits[i].mapX,AllUnits[i].mapY) )
			}
		}
	}
};
Map.prototype.getUnitsAtPosition = function(xMapPos,yMapPos,faction) {
  var UnitsAtPosition = [];
  for (var i = 0, li = AllUnits.length; i < li; i++)
  {
	  if(AllUnits[i].mapX == xMapPos &&
	     AllUnits[i].mapY == yMapPos &&
		 !AllUnits[i].hasMoved &&
		 (AllUnits[i].faction == faction ||
          faction == AllFactions ) )
	  {
		  UnitsAtPosition.push(AllUnits[i]);
	  }
  }
  return UnitsAtPosition;
}
Map.prototype.drawUnitsAtRect = function(xMapPos,yMapPos) {
  const STACKING_STEP = 2
  // this is used to stack friendly units upwards
  var yOffsetFriendly = 0 
  // this is used to stack enemy units downwards
  var yOffsetEnemy = 0   
  for (var i = 0, li = AllUnits.length; i < li; i++)
  {
	  var isFriendly = (AllUnits[i].faction == this.showFaction)
	  if(AllUnits[i].mapX == xMapPos &&
	     AllUnits[i].mapY == yMapPos &&
		 // allways show all friendly units
		 ( ( this.showRevealedOnly == false &&
		    (isFriendly
		    // or show when all units are to be shown
		    || this.showFaction == AllFactions
		    // or show unit when the position is in the visibleSet
		    || this.visibleSet[this.showFaction].has(
		      this.posAsString(xMapPos,yMapPos) ) ) )
		 || this.revealedPosition.has(
		      this.posAsString(xMapPos,yMapPos) ) ) )  
	  {
		  var textToShow = AllUnits[i].name
		  var yOffsets
		  var color = '#000'
		  if(isFriendly)
		  {
			  if(AllUnits[i].hasMoved)
			  {
				  textToShow = "\u21E3"+textToShow+"\u21E3" 
				  // alt: "\u21D3"
			  }
			  yOffset = yOffsetFriendly
			  yOffsetFriendly -= STACKING_STEP
			  if(yOffsetEnemy == 0) // first unit shown centered
				  yOffsetEnemy = STACKING_STEP
		  }
		  else
		  {
			  if(this.showFaction == AllFactions &&
			    AllUnits[i].faction == 0)
				color = '#00F' // blue in all faction mode
			  else
			    color = '#F00' // enemies are red
			  yOffset = yOffsetEnemy
			  yOffsetEnemy += STACKING_STEP
			  if(yOffsetFriendly == 0)  // first unit shown centered
				  yOffsetFriendly = -STACKING_STEP
		  }
		  if(AllUnits[i] == selectedUnit)
	        textToShow = "\u21D2"+textToShow+"\u21D0"
		  this.drawText(xMapPos,yMapPos,textToShow,
			  (AllUnits[i] == selectedUnit) // selected units are bold
			  ,0,yOffset,color);
	  }
  }
}
Map.prototype.drawSectorOrdinate = function(xMapPos,yMapPos
  ,textToShow,xOffset,yOffset)
{
	this.drawText(xMapPos,yMapPos,textToShow,false
	  ,xOffset,yOffset,'black')
}
Map.prototype.getMapUpperLeftX = function(xMapPos)
{
	return (xMapPos+1)*CELL_WIDTH
}
Map.prototype.getMapUpperLeftY = function(yMapPos)
{
	return (yMapPos+1)*CELL_WIDTH
}
Map.prototype.getMapCenterX = function(xMapPos)
{
	return this.getMapUpperLeftX(xMapPos)+CELL_WIDTH/2
}
Map.prototype.getMapCenterY = function(yMapPos)
{
	return this.getMapUpperLeftY(yMapPos)+CELL_WIDTH/2
}
Map.prototype.drawText = function(xMapPos,yMapPos,textToShow,
  isSelected,xOffset,yOffset,color)
 {
	var text = document.createElementNS(this.ns, 'text')
	text.setAttributeNS(null, 'x',this.getMapCenterX(xMapPos)+xOffset)
	text.setAttributeNS(null, 'y',this.getMapCenterY(yMapPos)+yOffset)
	text.setAttributeNS(null, 'fill', color)
	text.setAttributeNS(null, 'font-size', '2')
	if(isSelected)
	{
	  text.setAttributeNS(null, 'font-weight', 'bold')	
	}
	text.setAttributeNS(null, 'dominant-baseline', 'middle')
	text.setAttributeNS(null, 'text-anchor', 'middle')
	text.setAttributeNS(null, 'onclick', "map.PositionClicked("
	  +xMapPos+","+yMapPos+")")
	text.textContent = textToShow;
	this.svg.appendChild(text)
};
Map.prototype.PositionClicked = function(xMapPos,yMapPos) {
  if(  this.selectPositionMode  // used to place units in edit mode
    || this.showRevealedOnly ) // a mode that should not move units
  {
	  if(this.selectPositionMode != undefined)
	  {
	    this.selectPositionMode(xMapPos,yMapPos)
	  }
	  return;
  }
  if(selectedUnit != undefined &&
     !selectedUnit.IsAtPosition(xMapPos,yMapPos)) 
	 // move a unit that was selected
  {
	 if(selectedUnit.IsInMovementRange(xMapPos,yMapPos)
		 && this.countUnitsAt(xMapPos,yMapPos,this.showFaction)
	        < MAX_FACTION_STACKING )
	 {
		 selectedUnit.MoveTo(xMapPos,yMapPos)
		 GameEngine.autosave()
	 }
    selectedUnit = undefined	
  }
  else // select unit on this position or remove selection
  {
	  var units = this.getUnitsAtPosition(
	    xMapPos,yMapPos,this.showFaction);
	  // get selected unit index for faction
	  var selectedIndex = -1
	  for (var i = 0, li = units.length; i < li; i++)
	  {
		  if(units[i] == selectedUnit )
		  {
		    selectedIndex = i
		    break;
		  }
	  }
	  if(i != -1)
	  {
		  // if legal, increase by one, then mod length
		  // that is: select next unit here
		  i++
		  i %= units.length
		  selectedUnit = units[i]
	  }
	  else
	  {
		  if(units.length > 0)
		    selectedUnit = units[0]  // initial select
		  else
		    selectedUnit = undefined // deselect
	  }
  }
  this.draw()
};
Map.prototype.isPositionRevealed = function(xMapPos,yMapPos) {
	return this.revealedPosition.has(this.posAsString(xMapPos,yMapPos))
};
Map.prototype.getOffboardUnitsAsString = function(faction) {
	var result = ""
	for (var i = 0, li = AllUnits.length; i < li; i++)
	  {
		  if(AllUnits[i].faction == faction &&
		     AllUnits[i].IsOffboard())
		  {
			if(result != "")
			  result += ", "
		    if(AllUnits[i] == selectedUnit)
			  result += "\u21D2"
		    result += AllUnits[i].name
			if(AllUnits[i] == selectedUnit)
			  result += "\u21D0"
		  }
	  }
	return result
};
Map.prototype.drawOffboardRect = function(faction) {
	var mapAnchorY = -1
	var yOffsetText = -(CELL_WIDTH/4)
	var yOffsetRect = 0
	if(faction == 0)
	{
		mapAnchorY = this.height
		yOffsetText = (CELL_WIDTH/4)
		yOffsetRect = (CELL_WIDTH/2)
	}
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',this.getMapUpperLeftX(0)+1)
	rect.setAttributeNS(null, 'y',this.getMapUpperLeftY(mapAnchorY)
	  + yOffsetRect)
	rect.setAttributeNS(null, 'width', (this.width*CELL_WIDTH)-2)
	rect.setAttributeNS(null, 'height',(CELL_WIDTH/2))
	if(selectedUnit == undefined || selectedUnit.IsOffboard())
	  rect.setAttributeNS(null, 'fill', '#E1E1E1')
    else
	  rect.setAttributeNS(null, 'fill', '#A1A1A1')
	rect.setAttributeNS(null, 'onclick', "map.PositionClicked("
	  +Offboard+","+Offboard+")")
	this.svg.appendChild(rect)
	// ? relative position to rect maybe ?
	this.drawText(this.width/2-1,mapAnchorY,
	  "Offboard: "+this.getOffboardUnitsAsString(faction),false,
	  1,yOffsetText,'black')
}
Map.prototype.drawRect = function(xMapPos,yMapPos) {
	// ground indicator
	var groundElement = getMapElementAt(xMapPos,yMapPos)
	if(groundElement != undefined)
	{
	  var groundRect = document.createElementNS(this.ns, 'rect')
	  groundRect.setAttributeNS(null, 'x',this.getMapUpperLeftX(xMapPos)+1)
	  groundRect.setAttributeNS(null, 'y',this.getMapUpperLeftY(yMapPos)+1)
	  groundRect.setAttributeNS(null, 'width', CELL_WIDTH-2)
	  groundRect.setAttributeNS(null, 'height',CELL_WIDTH-2)
	  if(groundElement.type == WOODS)
	  {
	    groundRect.setAttributeNS(null, 'style',
		"stroke: none; fill: url(#patternWoods);") 
	  }
	  else if(groundElement.type == BUILDINGS)
	  {
	    groundRect.setAttributeNS(null, 'style',
		"stroke: none; fill: url(#patternBuildings);") 
	  }
	  else if(groundElement.type == HILL)
	  {
	    groundRect.setAttributeNS(null, 'style',
		"stroke: none; fill: url(#patternHills);") 
	  }
	  this.svg.appendChild(groundRect)
	}
	
	// visibility filter
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',this.getMapUpperLeftX(xMapPos)+1)
	rect.setAttributeNS(null, 'y',this.getMapUpperLeftY(yMapPos)+1)
	rect.setAttributeNS(null, 'width', CELL_WIDTH-2)
	rect.setAttributeNS(null, 'height',CELL_WIDTH-2)
	rect.setAttributeNS(null, 'fill-opacity',"0.3")
	if(selectedUnit && 
	  !selectedUnit.IsAtPosition(xMapPos,yMapPos) &&
	  this.countUnitsAt(xMapPos,yMapPos,this.showFaction)
	        < MAX_FACTION_STACKING &&
	  ((Math.abs(xMapPos-selectedUnit.mapX) <= 1
	  && Math.abs(yMapPos-selectedUnit.mapY) <= 1)
	  || selectedUnit.IsOffboard() ) )
	  rect.setAttributeNS(null, 'fill', '#111111')
	else if(this.isPositionRevealed(xMapPos,yMapPos))
	{
	  rect.setAttributeNS(null, 'fill', '#FFF')
	  rect.setAttributeNS(null, 'stroke','black')
	  rect.setAttributeNS(null, 'stroke-width','0.1')
	}
	else
	{
	  if(this.showRevealedOnly)
		rect.setAttributeNS(null, 'fill', '#818181')
	  else
		rect.setAttributeNS(null, 'fill', '#C1C1C1')
	}
	rect.setAttributeNS(null, 'onclick', "map.PositionClicked("
	  +xMapPos+","+yMapPos+")")
	this.svg.appendChild(rect)
	
	this.drawUnitsAtRect(xMapPos,yMapPos)
};
Map.prototype.countUnitsAt = function(xMapPos,yMapPos,faction) {
	var result = 0
	for (var i = 0, li = AllUnits.length; i < li; i++)
	{
	  if(AllUnits[i].faction == faction &&
	    AllUnits[i].IsAtPosition(xMapPos,yMapPos))
		result++
    }
	return result
};
Map.prototype.toggleRevealed = function() {
	this.showRevealedOnly = !this.showRevealedOnly
	this.draw()
}


var map = new Map(12,8)
map.draw()



///////////////////  GameEngine  /////////////
var GameEngine = {
	ResetDefaultScenario:function() {
	  this.clearScenario()
	  ScenarioName = 'McPherson Ridge'
	  ScenarioDescription = 'Initial phase of Gettysburg'
	  FactionName[0] = 'Union'
	  FactionName[1] = 'Confederates'
	  
      new Unit('76th NY','Cmd 7',9,5,0)
      new Unit('56th PA','Cmd 7',8,5,0)
      new Unit('147th NY','Cmd 7',5,7,0)
      new Unit('95th NY','Cmd 7',5,4,0)
	  new Unit('84th NY','Cmd 7',4,4,0)
	  
	  new Unit('42th TN','Cmd 7',5,2,1)
	  new Unit('2nd TN','Cmd 7',4,1,1)
	  new Unit('1st TN','Cmd 7',3,0,1)
	  new Unit('13th AL','Cmd 7',2,0,1)
	  
	  new Unit('42th MS','Cmd 7',Offboard,Offboard,1)
	  new Unit('2nd MS','Cmd 7',10,0,1)
	  new Unit('55th NC','Cmd 7',11,2,1)
	  
	  new Unit('2nd WI','Cmd 7',0,7,0)
	  new Unit('7th WI','Cmd 7',2,7,0)
	  new Unit('19th WI','Cmd 7',Offboard,Offboard,0)
	  new Unit('24th WI','Cmd 7',Offboard,Offboard,0)
	  
	  new MapElement(9,3,WOODS)
	  new MapElement(7,0,WOODS)
	  new MapElement(9,2,WOODS)
	  new MapElement(4,4,WOODS)
	  new MapElement(10,7,WOODS)
	  new MapElement(9,7,WOODS)
      new MapElement(5,4,BUILDINGS)
	  
	  UIController.updateFactionNamesView()
	  UIController.updateScenarioInformation()
    },
	prepareRound:function(faction)
	{
	  selectedUnit = undefined
	  for (var i = 0, li = AllUnits.length; i < li; i++)
	  {
		  if(AllUnits[i].faction != faction)
		  {
			  AllUnits[i].hasMoved = false
		  }
	  }
	},
	currentScenarioToObject:function()
	{
	  var scenarioObject = {};
	  scenarioObject["ScenarioName"]        = ScenarioName
	  scenarioObject["ScenarioDescription"] = ScenarioDescription
	  scenarioObject["MapWidth"]            = map.width
	  scenarioObject["MapHeight"]           = map.height
	  scenarioObject["FactionName"]         = FactionName.slice(0)
	  scenarioObject["AllUnits"]            = AllUnits.slice(0)
	  scenarioObject["MapTerrainElements"]   
	                                        = MapTerrainElements.slice(0)
	  return scenarioObject
	},
	clearScenario:function() {
	  AllUnits = [];
	  MapTerrainElements = [];
	  map.width = 12
	  map.height = 8
	},
	loadFromScenario:function(scenarioAsJSON)
	{
	  if(scenarioAsJSON == undefined || scenarioAsJSON == "undefined")
	    return
	  this.clearScenario()
      var scenarioObject = JSON.parse(scenarioAsJSON)
	  ScenarioName = scenarioObject["ScenarioName"]
	  ScenarioDescription = scenarioObject["ScenarioDescription"]
	  if(scenarioObject["MapWidth"] == undefined)
        map.width = 12
      else
	    map.width = scenarioObject["MapWidth"]
	  if(scenarioObject["MapHeight"] == undefined)
	    map.height = 8
	  else
	    map.height = scenarioObject["MapHeight"]
	  FactionName = scenarioObject["FactionName"]
	  for(var i = 0; i < scenarioObject.AllUnits.length;i++)
	  {
		  var unit = new Unit(
		    scenarioObject.AllUnits[i].name,
			scenarioObject.AllUnits[i].description,
			scenarioObject.AllUnits[i].mapX,
			scenarioObject.AllUnits[i].mapY,
			scenarioObject.AllUnits[i].faction,
		  )
		  unit.hasMoved = scenarioObject.AllUnits[i].hasMoved
	  }
	  if(scenarioObject.MapTerrainElements != undefined)
	  {
	    for(var i = 0; i < scenarioObject.MapTerrainElements.length;i++)
	    {
		  var mapElement = new MapElement(
			scenarioObject.MapTerrainElements[i].mapX,
			scenarioObject.MapTerrainElements[i].mapY,
			scenarioObject.MapTerrainElements[i].type,
		  )
	    }
	  }
	  UIController.updateFactionNamesView()
	  UIController.updateScenarioInformation()
	},
	autosave:function()
	{
	  var scenario = this.currentScenarioToObject()
	  localStorage.setItem('autosave.scenario', 
	    JSON.stringify(scenario) );
	},
	autoload:function()
	{
	  var scenario = localStorage.getItem('autosave.scenario')
	  if(scenario != undefined && scenario != 'undefined')
	  {
		this.loadFromScenario(scenario)
	  }
	  else
	  {
		this.ResetDefaultScenario()
	  }
	  // initial help text shown once
	  var showInitialDescription =
	    localStorage.getItem('showInitialDescription')
	  if(showInitialDescription == undefined 
	     || showInitialDescription == true) // unlikely
	  {
		  localStorage.setItem('showInitialDescription',false)
		  UIController.showMapNow()
	  }
	  else
	  {
		  // hide help and set revealed only filter
		  document.getElementById('BasicHelp').style.display = 'none'
		  UIController.showMapRevealed()
	  }
	},
}



///////////////////  UI Controller  /////////////
var UIController = {
	mapView : document.getElementById('MapView'),
	mainMenu : document.getElementById('MainMenu'),
	basicHelp : document.getElementById('BasicHelp'),
	editView : document.getElementById('EditView'),
	editWarning : document.getElementById('EditWarning'),
	unitListTemplate : document.querySelector('#UnitListTemplate'),
	unitListTable0 : document.querySelector('#UnitListTableFaction0'),
	unitListTable1 : document.querySelector('#UnitListTableFaction1'),
	unitNameInput : document.querySelector('#UnitName'),
	unitDecriptionInput : document.querySelector('#UnitDescription'),
	faction0NameInput : document.querySelector('#Faction0Name'),
	faction1NameInput : document.querySelector('#Faction1Name'),
	showMapWarning : document.getElementById("MapViewWarning"),
	aboutView : document.getElementById("About"),
	mapViewBackCallback : undefined,
	firstStart : true,
	currentEditedUnit : 0,
	selectedMapY : 0,
	selectedMapY : 0,
	MapViewBackButton:function()
	{
		if(this.mapViewBackCallback != undefined)
		{
			this.mapViewBackCallback()
			this.mapViewBackCallback = undefined
		}
	},
	showMainMenu:function()
	{
		map.selectPositionMode =undefined // no special actions on next map click
		this.hideEverything()
		this.mainMenu.style.display = "block"
	},
	hideEverything:function()
	{
		if(this.firstStart == true)
		  this.firstStart = false
		else
		{
			this.basicHelp.style.display = "none"
			this.mapView.style.display = "none"
		}
		this.mainMenu.style.display = "none"
		this.editView.style.display = "none"
		this.editWarning.style.display = "none"
		this.showMapWarning.style.display = "none"
		this.aboutView.style.display = "none"
	},
	showAbout: function()
	{
		this.hideEverything()
		this.aboutView.style.display = "block"
	},
	showMapRevealed: function()
	{
		this.mapViewBackCallback = () => UIController.showMainMenu()
		map.showFaction = AllFactions
		map.setShowRevealedOnly(true)
		map.draw()
		this.hideEverything()
		this.mapView.style.display = "block"
		document.getElementById("toggleRevealedButton").style.display = "none"
	},
	showMap: function(faction)
	{
		this.hideEverything()
		map.showFaction = faction
		if(faction == AllFactions)
		{
			this.showMapNow()
		}
		else
		{
			document.getElementById("MapWarningText").innerHTML 
		      = "View map for " + FactionName[faction] + "?"
			this.showMapWarning.style.display = "block"
		}
	},
	showMapNow: function()
	{
		this.mapViewBackCallback = () => UIController.showMainMenu()
		GameEngine.prepareRound(map.showFaction)
		document.getElementById("LastMoveIndicator").innerHTML =
		  "Last move: " + FactionName[map.showFaction]
		map.setShowRevealedOnly(false)
		map.draw()
		this.hideEverything()
		this.mapView.style.display = "block"
		document.getElementById("toggleRevealedButton").style.display = "block"
	},
	toggleRevealedOnly: function()
	{
		map.toggleRevealed()
	},
	showEdit: function()
	{
		this.hideEverything()
		this.updateUnitList()
		this.showUnitEdited()
		this.editView.style.display = "block"
	},
	showEditWarning: function()
	{
		this.hideEverything()
		this.editWarning.style.display = "block"
	},
	selectPosition: function()
	{
		this.hideEverything()
		map.selectPositionMode = (x,y) => UIController.positionWasSelected(x,y)
		this.showMap(AllFactions)
	},
	positionWasSelected: function(mapX,mapY)
	{
		map.selectPositionMode = undefined
		map.draw()
		this.showEdit()
		this.selectedMapX = mapX
		this.selectedMapY = mapY
		this.updateUnitEdited() // position auto updates edit unit
		GameEngine.autosave()  // and save
	},
	showAllMap: function()
	{
		this.hideEverything()
		map.setShowRevealedOnly(false)
		map.selectPositionMode = (x,y) => UIController.mapWasShown(x,y)
		this.showMap(AllFactions)
		this.mapViewBackCallback = () => UIController.showEdit()
	},
	mapWasShown: function(mapX,mapY)
	{
		map.selectPositionMode = undefined
		map.draw()
		this.showEdit()
	},
	updateFactionUnitList: function(faction)
	{
		var new_tbody = document.createElement('tbody')
		for (var i = 0, li = AllUnits.length; i < li; i++)
        {
			if(faction != AllUnits[i].faction)
			  continue
			var clone = this.unitListTemplate.content.cloneNode(true);
			var td = clone.querySelectorAll("td");
			td[0].textContent = AllUnits[i].name
			td[1].textContent = AllUnits[i].description
			new_tbody.appendChild(clone)
        }
        return new_tbody
	},
	updateScenario: function()
	{
		ScenarioName
		  = document.getElementById("ScenarioName").value
		ScenarioDescription
		  = document.getElementById("ScenarioDescription").value
		FactionName[0] = this.faction0NameInput.value
		FactionName[1] = this.faction1NameInput.value
		map.width = document.getElementById("ScenarioWidth").value
		map.height = document.getElementById("ScenarioHeight").value
		this.updateScenarioData()
	},
	updateScenarioData: function()
	{
		this.updateFactionNamesView()
		this.updateScenarioInformation()
		GameEngine.autosave()
	},
	updateScenarioInformation: function()
	{
		document.getElementById("ScenarioName").value
		  = ScenarioName
		document.getElementById("ScenarioDescription").value
		  = ScenarioDescription
		document.getElementById("MainMenuScenarioName").innerHTML 
		  = ScenarioName
		document.getElementById("MainMenuScenarioDescription").      
		  innerHTML 
		  = ScenarioDescription
		document.getElementById("ScenarioWidth").value = map.width
		document.getElementById("ScenarioHeight").value = map.height
    },
	updateFactionNamesView: function()
	{
		// set in edit menu
		this.faction0NameInput.value = FactionName[0]
		this.faction1NameInput.value = FactionName[1]
		// set in edit view unit list
		document.getElementById("faction0Header").innerHTML 
		  = FactionName[0]+ " unit"
		document.getElementById("faction1Header").innerHTML 
		  = FactionName[1]+ " unit"
		// set in edit view faction seletion for a unit
		document.getElementById("faction0Radio").innerHTML 
		  = FactionName[0]
		document.getElementById("faction1Radio").innerHTML 
		  = FactionName[1]
		// set in main menu
		document.getElementById("faction0MapViewButton").innerHTML 
		  = "Map view: "+FactionName[0]
		document.getElementById("faction1MapViewButton").innerHTML 
		  = "Map view: "+FactionName[1]
	},
	updateUnitList: function()
	{
		tbody = this.updateFactionUnitList(0,this.unitListTable0)
		this.unitListTable0.parentNode.replaceChild(
		  tbody, this.unitListTable0)
		this.unitListTable0 = tbody
		tbody = this.updateFactionUnitList(1,this.unitListTable0)
		this.unitListTable1.parentNode.replaceChild(
		  tbody, this.unitListTable1)
		this.unitListTable1 = tbody
	},
	editNextUnit: function()
	{
		this.currentEditedUnit++
		if(this.currentEditedUnit >= AllUnits.length)
		  this.currentEditedUnit = 0
        this.showUnitEdited()	  
	},
	addUnitEditedAsNew: function()
	{
	    var faction = 0
		if(!document.getElementById("faction0").checked)
		{
		  faction = 1
		}
		new Unit(this.unitNameInput.value,
		  this.unitDecriptionInput.value,
		  this.selectedMapX,
		  this.selectedMapY,
		  faction)
		this.updateUnitList()
	    // the added values represent the last unit of the list now
		this.currentEditedUnit = AllUnits.length - 1
	},
	deleteUnitEdited: function()
	{
		if(this.currentEditedUnit >= 0 &&
		   this.currentEditedUnit < AllUnits.length)
		{
	      AllUnits.splice(this.currentEditedUnit, 1)
		  this.currentEditedUnit--
		  if(this.currentEditedUnit < 0)
		    this.currentEditedUnit = 0
		  this.updateUnitList()
		  this.showUnitEdited()
		}
	},
	updateUnitEdited: function()
	{
		if(this.currentEditedUnit >= 0 &&
		   this.currentEditedUnit < AllUnits.length)
		{
		    AllUnits[this.currentEditedUnit].name
			  = this.unitNameInput.value
		    AllUnits[this.currentEditedUnit].description
			  = this.unitDecriptionInput.value
		  if(document.getElementById("faction0").checked)
		  {
		    AllUnits[this.currentEditedUnit].faction = 0
		  }
		  else
		  {
			AllUnits[this.currentEditedUnit].faction = 1
		  }
		  AllUnits[this.currentEditedUnit].hasMoved = false
		  AllUnits[this.currentEditedUnit].mapX
		    = this.selectedMapX
		  AllUnits[this.currentEditedUnit].mapY
		    = this.selectedMapY
		  this.updateUnitList()
		  GameEngine.autosave()
		}
	},
	showUnitEdited: function()
	{
		if(this.currentEditedUnit >= 0 &&
		   this.currentEditedUnit < AllUnits.length)
		{
	      this.unitNameInput.value = 
		    AllUnits[this.currentEditedUnit].name
		  this.unitDecriptionInput.value = 
		    AllUnits[this.currentEditedUnit].description
		  if(AllUnits[this.currentEditedUnit].faction == 0)
		  {
		    document.getElementById("faction0").checked = true;
		  }
		  else
		  {
			document.getElementById("faction1").checked = true;
		  }
		  this.selectedMapX = AllUnits[this.currentEditedUnit].mapX
		  this.selectedMapY = AllUnits[this.currentEditedUnit].mapY
		}
	},
	download: function(filename) {
      var scenario = GameEngine.currentScenarioToObject()
	  var text = JSON.stringify(scenario)
      var element = document.createElement('a');
      element.setAttribute('href', 
	    'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
	load: function() {
		document.getElementById('fileInput').click();
	},
	addWoods: function() {
		this.hideEverything()
		map.selectPositionMode = 
		  (x,y) => UIController.addTerrain(x,y,WOODS)
		this.showMap(AllFactions)
		this.mapViewBackCallback = () => UIController.showEdit()
    },
	addBuildings: function() {
		this.hideEverything()
		map.selectPositionMode = 
		  (x,y) => UIController.addTerrain(x,y,BUILDINGS)
		this.showMap(AllFactions)
		this.mapViewBackCallback = () => UIController.showEdit()
    },
	addHills: function() {
		this.hideEverything()
		map.selectPositionMode = 
		  (x,y) => UIController.addTerrain(x,y,HILL)
		this.showMap(AllFactions)
		this.mapViewBackCallback = () => UIController.showEdit()
    },
	clearTerrain: function() {
		this.hideEverything()
		map.selectPositionMode = 
		  (x,y) => UIController.deleteTerrain(x,y)
		this.showMap(AllFactions)
		this.mapViewBackCallback = () => UIController.showEdit()
    },
	addTerrain: function(x,y,type) {
		var terrainElements = getMapElementAt(x,y)
		if(terrainElements != undefined)
		{
			terrainElements.type = type
		}
		else
		{
			new MapElement(x,y,type)
		}
		map.draw()
		GameEngine.autosave()
	},
	deleteTerrain: function(x,y) {
		deleteMapElementAt(x,y)
		map.draw()
		GameEngine.autosave()
	},
}

// file loading callback
document.getElementById('fileInput').addEventListener('change', function selectedFileChanged() {
  if (this.files.length === 0) {
    console.log('No file selected.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function fileReadCompleted() {
    // when the reader is done, the content is in reader.result.
    GameEngine.loadFromScenario(reader.result)
  };
  reader.readAsText(this.files[0]);
});

////////////////////////////////////////////////////////////
// Installer
// installation stuff: service worker needed
console.log('Service worker...');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', {})
  .then((reg) => {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch((error) => {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
else
{
	console.log('No service worker in app');
}
// catch installable event
let deferredPrompt;
// hide installation hint
document.getElementById('installationHint').style.display = "none"
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  document.getElementById('installationHint').style.display = "block"
  document.getElementById('installButton').addEventListener('click', (e) => {
  // hide our user interface that shows our A2HS button
  document.getElementById('installationHint').style.display = 'none';
  // Show the prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
  });
});
//////////////////////////////////////////////////////////////

GameEngine.autoload()