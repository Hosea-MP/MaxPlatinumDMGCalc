$.fn.DataTable.ColVis.prototype._fnDomColumnButton = function(i) {
	var
		that = this,
		column = this.s.dt.aoColumns[i],
		dt = this.s.dt;

	var title = this.s.fnLabel === null ?
		column.sTitle :
		this.s.fnLabel(i, column.sTitle, column.nTh);

	return $(
			'<li ' + (dt.bJUI ? 'class="ui-button ui-state-default"' : '') + '>' +
			'<label>' +
			'<input type="checkbox" />' +
			'<span>' + title + '</span>' +
			'</label>' +
			'</li>'
		)
		.click(function(e) {
			var showHide = !$('input', this).is(":checked");
			if (e.target.nodeName.toLowerCase() !== "li") {
				showHide = !showHide;
			}

			var oldIndex = $.fn.dataTableExt.iApiIndex;
			$.fn.dataTableExt.iApiIndex = that._fnDataTablesApiIndex();

			if (dt.oFeatures.bServerSide) {
				that.s.dt.oInstance.fnSetColumnVis(i, showHide, false);
				that.s.dt.oInstance.fnAdjustColumnSizing(false);
				if (dt.oScroll.sX !== "" || dt.oScroll.sY !== "") {
					that.s.dt.oInstance.oApi._fnScrollDraw(that.s.dt);
				}
				that._fnDrawCallback();
			} else {
				that.s.dt.oInstance.fnSetColumnVis(i, showHide);
			}

			$.fn.dataTableExt.iApiIndex = oldIndex;

			if ((e.target.nodeName.toLowerCase() === 'input' || e.target.nodeName.toLowerCase() === 'li') && that.s.fnStateChange !== null) {
				that.s.fnStateChange.call(that, i, showHide);
			}
		})[0];
};

$.fn.dataTableExt.oSort['damage100-asc'] = function(a, b) {
	return parseFloat(a) - parseFloat(b);
};
$.fn.dataTableExt.oSort['damage100-desc'] = function(a, b) {
	return parseFloat(b) - parseFloat(a);
};

$.fn.dataTableExt.oSort['damage48-asc'] = function(a, b) {
	return parseInt(a) - parseInt(b);
};
$.fn.dataTableExt.oSort['damage48-desc'] = function(a, b) {
	return parseInt(b) - parseInt(a);
};

async function loadProgressionPoints() {
	try {
		const response = await fetch('encounters.json');
		const data = await response.json();
		const select = document.getElementById('progression-select');

		data.forEach(point => {
			const option = document.createElement('option');
			option.value = JSON.stringify(point.encounters);
			option.text = `${point.boss} (${point.location})`;
			select.appendChild(option);
		});
	} catch (error) {
		console.error('Error loading progression points:', error);
	}
}

function getMovesForType(type) {
	return Object.entries(moves)
		.filter(([name, move]) => {
			return move.type === type &&
				move.bp >= 70 &&
				move.bp <= 70 &&
				move.category !== 'Status';
		})
		.map(([name]) => name);
}

function selectMovesForPokemon(types) {
	let selectedMoves = [];

	types.forEach(type => {
		if (!type) return;

		const movesOfType = getMovesForType(type);
		if (movesOfType.length > 0) {

			const randomMove = movesOfType[Math.floor(Math.random() * movesOfType.length)];
			selectedMoves.push(randomMove);
		}
	});

	while (selectedMoves.length < 4) {
		selectedMoves.push('(No Move)');
	}

	return selectedMoves;
}

function performCalculations() {
    var dataSet = [];
    var pokeInfo = $("#p1");
    
    const progressionSelect = document.getElementById('progression-select');
    const selectedEncounters = progressionSelect.value ? 
        JSON.parse(progressionSelect.value) : null;
    
    const pokemonToCalculate = selectedEncounters || getSetOptions();

    for (var i = 0; i < pokemonToCalculate.length; i++) {
        let pokemonId;

        if (selectedEncounters) {
            pokemonId = pokemonToCalculate[i];
            let baseName = pokemonId.split('-')[0];
            let isInPokedex = !!pokedex[pokemonId];
            let baseInPokedex = !!pokedex[baseName];

            if (!isInPokedex && !baseInPokedex) {
                continue;
            }

            let actualPokemonId = isInPokedex ? pokemonId : baseName;
            if (!setdex[actualPokemonId] || !setdex[actualPokemonId]["Blank Set"]) {
                const pokemon = pokedex[actualPokemonId];
                const types = [pokemon.types[0], pokemon.types[1] || null].filter(Boolean);
                const selectedMoves = selectMovesForPokemon(types);
                
                setdex[actualPokemonId] = setdex[actualPokemonId] || {};
                setdex[actualPokemonId]["Blank Set"] = {
                    level: 100,
                    ability: pokemon?.abilities?.[0] || "",
                    item: "",
                    nature: "Bashful",
                    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
                    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
                    moves: selectedMoves
                };
            }

            pokemonId = actualPokemonId + " (Blank Set)";
        } else {
            if (!pokemonToCalculate[i].id) continue;
            pokemonId = pokemonToCalculate[i].id;
        }

        var field = createField();
        
        var attackerDealt = createPokemon(pokeInfo);
        var defenderDealt = createPokemon(pokemonId);
        var damageResultsDealt = calculateMovesOfAttacker(gen, attackerDealt, defenderDealt, field);
         
        field.swap();
        var attackerReceived = createPokemon(pokemonId);
        var defenderReceived = createPokemon(pokeInfo);
        var damageResultsReceived = calculateMovesOfAttacker(gen, attackerReceived, defenderReceived, field);

        let bestDamageDealt = 0;
        let bestMoveDealt = null;
        let bestMoveDealtResult = null;
        
        for (var n = 0; n < 4; n++) {
            if (attackerDealt.moves[n].bp === 0) continue;
            
            var result = damageResultsDealt[n];
            var minMaxDamage = result.range();
            var maxDamage = minMaxDamage[1] * attackerDealt.moves[n].hits;
            var maxPercentage = Math.floor(maxDamage * 1000 / defenderDealt.maxHP()) / 10;
            
            if (maxPercentage > bestDamageDealt) {
                bestDamageDealt = maxPercentage;
                bestMoveDealt = attackerDealt.moves[n];
                bestMoveDealtResult = result;
            }
        }

        let bestDamageReceived = 0;
        let bestMoveReceived = null;
        let bestMoveReceivedResult = null;
        
        for (var n = 0; n < 4; n++) {
            if (attackerReceived.moves[n].bp === 0) continue;
            
            var result = damageResultsReceived[n];
            var minMaxDamage = result.range();
            var maxDamage = minMaxDamage[1] * attackerReceived.moves[n].hits;
            var maxPercentage = Math.floor(maxDamage * 1000 / defenderReceived.maxHP()) / 10;
            
            if (maxPercentage > bestDamageReceived) {
                bestDamageReceived = maxPercentage;
                bestMoveReceived = attackerReceived.moves[n];
                bestMoveReceivedResult = result;
            }
        }

        if (bestMoveDealt && bestMoveReceived) {
            var receivedMinMaxDamage = bestMoveReceivedResult.range();
            var receivedMinDamage = receivedMinMaxDamage[0] * bestMoveReceived.hits;
            var receivedMaxDamage = receivedMinMaxDamage[1] * bestMoveReceived.hits;
            var receivedMinPercentage = Math.floor(receivedMinDamage * 1000 / defenderReceived.maxHP()) / 10;
            var receivedMaxPercentage = Math.floor(receivedMaxDamage * 1000 / defenderReceived.maxHP()) / 10;
            
            var dealtMinMaxDamage = bestMoveDealtResult.range();
            var dealtMinDamage = dealtMinMaxDamage[0] * bestMoveDealt.hits;
            var dealtMaxDamage = dealtMinMaxDamage[1] * bestMoveDealt.hits;
            var dealtMinPercentage = Math.floor(dealtMinDamage * 1000 / defenderDealt.maxHP()) / 10;
            var dealtMaxPercentage = Math.floor(dealtMaxDamage * 1000 / defenderDealt.maxHP()) / 10;

            dataSet.push([
                pokemonId.split(" (")[0],
                formatMoveName(bestMoveReceived.name, bestMoveReceived.type),  // Enemy's Move
                receivedMinPercentage + " - " + receivedMaxPercentage + "%",  // Damage Received
                formatMoveName(bestMoveDealt.name, bestMoveDealt.type),  // Our Move
                dealtMinPercentage + " - " + dealtMaxPercentage + "%"  // Damage Dealt
            ]);
        }
    }

    table.clear();
    table.rows.add(dataSet).draw();
}

function formatMoveName(moveName, moveType) {
    if (moveName.startsWith('Hidden Power')) {
        return 'Hidden Power (' + moveType + ')';
    }
    return moveName + " (" + moveType + ")";
}

function getSelectedTiers() {
	var selectedTiers = $('.tiers input:checked').map(function() {
		return this.id;
	}).get();
	return selectedTiers;
}

function calculateMovesOfAttacker(gen, attacker, defender, field) {
	var results = [];
	for (var i = 0; i < 4; i++) {
		results[i] = calc.calculate(gen, attacker, defender, attacker.moves[i], field);
	}
	return results;
}

$(".gen").change(function() {
	$(".tiers input").prop("checked", false);
	$("#singles-format").attr("disabled", false);
	adjustTierBorderRadius();

	if ($.fn.DataTable.isDataTable("#holder-2")) {
		table.clear();
		constructDataTable();
		placeBsBtn();
	}
});

function adjustTierBorderRadius() {
	var squaredLeftCorner = {
		"border-top-left-radius": 0,
		"border-bottom-left-radius": 0
	};
	var roundedLeftCorner = {
		"border-top-left-radius": "8px",
		"border-bottom-left-radius": "8px"
	};
	if (gen <= 2) {
		$("#UU").next("label").css(roundedLeftCorner);
	} else {
		$("#UU").next("label").css(squaredLeftCorner);
		$("#NU").next("label").css(roundedLeftCorner);

		if (gen > 3) {
			$("#NU").next("label").css(squaredLeftCorner);
			$("#LC").next("label").css(roundedLeftCorner);

			if (gen > 4) {
				$("#LC").next("label").css(squaredLeftCorner);
				$("#Doubles").next("label").css(roundedLeftCorner);

				if (gen > 5) {
					$("#Doubles").next("label").css(squaredLeftCorner);
				}
			}
		}
	}
}

var table;
var checksTable;

function constructDataTable() {
    table = $("#holder-2").DataTable({
        destroy: true,
        columns: [
            { title: "Our Pokemon", data: 0 },
            { title: "Our Move", data: 1 },
            { title: "Damage Dealt", data: 2 },
            { title: "Enemy's Move", data: 3 },
            { title: "Damage Received", data: 4 }
        ],
        columnDefs: [
            {
                targets: [2, 4],
                type: 'damage100'
            }
        ],
        dom: 'C<"clear">fti',
        paging: false,
        scrollX: Math.floor(dtWidth / 100) * 100,
        scrollY: dtHeight,
        scrollCollapse: true,
        autoWidth: false
    });
    
    $(".dataTables_wrapper").css({
        "max-width": dtWidth
    });
}

function placeBsBtn() {
	var honkalculator = "<button style='position:absolute' class='bs-btn bs-btn-default'>Honkalculate</button>";
	$("#holder-2_wrapper").prepend(honkalculator);
	$(".bs-btn").click(function() {
		var formats = getSelectedTiers();
		if (!formats.length) {
			$(".bs-btn").popover({
				content: "No format selected",
				placement: "right"
			}).popover('show');
			setTimeout(function() {
				$(".bs-btn").popover('destroy');
			}, 1350);
		}
		table.clear();
		performCalculations();
	});
}

$(".mode").change(function() {
	if ($("#one-vs-one").prop("checked")) {
		var params = new URLSearchParams(window.location.search);
		params.delete('mode');
		params = '' + params;
		window.location.replace('index' + linkExtension + (params.length ? '?' + params : ''));
	} else if ($("#randoms").prop("checked")) {
		var params = new URLSearchParams(window.location.search);
		params.delete('mode');
		params = '' + params;
		window.location.replace('randoms' + linkExtension + (params.length ? '?' + params : ''));
	} else {
		var params = new URLSearchParams(window.location.search);
		params.set('mode', $(this).attr("id"));
		window.location.replace('index' + linkExtension + '?' + params);
	}
});

$(".tiers label").mouseup(function() {
	var oldID = $('.tiers input:checked').attr("id");
	var newID = $(this).attr("for");
	if ((oldID === "Doubles" || startsWith(oldID, "VGC")) && (newID !== oldID)) {
		$("#singles-format").attr("disabled", false);
		$("#singles-format").prop("checked", true);
	}
	if ((startsWith(oldID, "VGC") || oldID === "LC") && (!startsWith(newID, "VGC") && newID !== "LC")) {
		setLevel("100");
	}
});

$(".tiers input").change(function() {
	var type = $(this).attr("type");
	var id = $(this).attr("id");
	$(".tiers input").not(":" + type).prop("checked", false);

	if (id === "Doubles" || startsWith(id, "VGC")) {
		$("#doubles-format").prop("checked", true);
		$("#singles-format").attr("disabled", true);
	}

	if (id === "LC" && $('.level').val() !== "5") {
		setLevel("5");
	}

	if (startsWith(id, "VGC") && $('.level').val() !== "50") {
		setLevel("50");
	}
});

function setLevel(lvl) {
	$('.level').val(lvl);
	$('.level').keyup();
	$('.level').popover({
		content: "Level has been set to " + lvl,
		placement: "right"
	}).popover('show');
	setTimeout(function() {
		$('.level').popover('destroy');
	}, 1350);
}

$(".set-selector").change(function(e) {
	var genWasChanged;
	var format = getSelectedTiers()[0];
	if (genWasChanged) {
		genWasChanged = false;
	} else if (startsWith(format, "VGC") && $('.level').val() !== "50") {
		setLevel("50");
	} else if (format === "LC" && $('.level').val() !== "5") {
		setLevel("5");
	}
});

var dtHeight, dtWidth;
$(document).ready(function() {
    var params = new URLSearchParams(window.location.search);
    window.mode = params.get("mode");
    if (window.mode) {
        if (window.mode === "randoms") {
            window.location.replace("randoms" + linkExtension + "?" + params);
        } else if (window.mode !== "one-vs-all" && window.mode !== "all-vs-one") {
            window.location.replace("index" + linkExtension + "?" + params);
        }
    } else {
        window.mode = "one-vs-all";
    }

    $("#" + mode).prop("checked", true);
    $("#holder-2 th:first").text((mode === "one-vs-all") ? "Pokemon" : "Pokemon");
    $("#holder-2").show();

    $("#OU").prop("checked", true);

    loadProgressionPoints();

    calcDTDimensions();
    constructDataTable();   
    placeBsBtn();
});

$(".gen").change(function() {
	$(".tiers input").prop("checked", false);
	$("#singles-format").attr("disabled", false);

	$("#OU").prop("checked", true);
	adjustTierBorderRadius();

	if ($.fn.DataTable.isDataTable("#holder-2")) {
		table.clear();
		constructDataTable();
		placeBsBtn();
	}
});

function calcDTDimensions() {
	$("#holder-2").DataTable({
		dom: 'C<"clear">frti'
	});

	var theadBottomOffset = getBottomOffset($(".sorting"));
	var heightUnderDT = getBottomOffset($(".holder-0")) - getBottomOffset($("#holder-2 tbody"));
	dtHeight = $(document).height() - theadBottomOffset - heightUnderDT;
	dtWidth = $(window).width() - $("#holder-2").offset().left;
	dtWidth -= 2 * parseFloat($(".holder-0").css("padding-right"));
}

function getBottomOffset(obj) {
	return obj.offset().top + obj.outerHeight();
}