function performCalculations() {
    var attacker, defender;
    var dataSet = [];
    var pokeInfo = $("#p1");
    var pokemonDamageStats = {};

    var secondaryTitle = document.getElementById('secondary-table-title');
    var damageHeader = document.getElementById('damage-column-header');
    if (mode === "one-vs-all") {
        secondaryTitle.textContent = "Checks Pokemon (Average Damage < 40%)";
        damageHeader.textContent = "Avg Damage %";
    } else {
        secondaryTitle.textContent = "Counter Pokemon (One Move's Damage > 75%)";
        damageHeader.textContent = "Damage (%)";
    }

    const progressionSelect = document.getElementById('progression-select');
    const selectedEncounters = progressionSelect.value ?
        JSON.parse(progressionSelect.value) : null;

    const pokemonToCalculate = selectedEncounters || getSetOptions();

    for (var i = 0; i < pokemonToCalculate.length; i++) {
        let pokemonId;
        let baseInfo;

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
                    evs: {
                        hp: 0,
                        atk: 0,
                        def: 0,
                        spa: 0,
                        spd: 0,
                        spe: 0
                    },
                    ivs: {
                        hp: 31,
                        atk: 31,
                        def: 31,
                        spa: 31,
                        spd: 31,
                        spe: 31
                    },
                    moves: selectedMoves
                };
            } else if (mode === "one-vs-all" && setdex[actualPokemonId]["Blank Set"]) {
                setdex[actualPokemonId]["Blank Set"].level = 100;
                setdex[actualPokemonId]["Blank Set"].nature = "Bashful";
            }

            let fullId = actualPokemonId + " (Blank Set)";
            baseInfo = [fullId];
            pokemonId = fullId;
        } else {
            if (!pokemonToCalculate[i].id || typeof pokemonToCalculate[i].id === "undefined") continue;
            pokemonId = pokemonToCalculate[i].id;
            setName = pokemonId.substring(pokemonId.indexOf("(") + 1, pokemonId.lastIndexOf(")"));
            setTier = setName.substring(0, setName.indexOf(" "));
            if (selectedTiers.indexOf(setTier) === -1) continue;
            baseInfo = [pokemonId];
        }

        var field = createField();
        try {
            if (mode === "one-vs-all") {
                attacker = createPokemon(pokeInfo);
                defender = createPokemon(pokemonId);
            } else {
                attacker = createPokemon(pokemonId);
                defender = createPokemon(pokeInfo);
                field.swap();
            }
        } catch (error) {
            console.error("Error creating Pokemon:", pokemonId, error);
            continue;
        }

        if (attacker.ability === "Rivalry") {
            attacker.gender = "N";
        }
        if (defender.ability === "Rivalry") {
            defender.gender = "N";
        }

        var damageResults = calculateMovesOfAttacker(gen, attacker, defender, field);
        attacker = damageResults[0].attacker;
        defender = damageResults[0].defender;

        if (!pokemonDamageStats[pokemonId]) {
            pokemonDamageStats[pokemonId] = {
                totalDamage: 0,
                moveCount: 0,
                maxDamage: 0,
                types: [(mode === "one-vs-all") ? defender.types[0] : attacker.types[0],
                       ((mode === "one-vs-all") ? defender.types[1] : attacker.types[1]) || ""]
            };
        }

        for (var n = 0; n < 4; n++) {
            var result = damageResults[n];
            
            if (attacker.moves[n].bp === 0) continue;
            
            var minMaxDamage = result.range();
            var minDamage = minMaxDamage[0] * attacker.moves[n].hits;
            var maxDamage = minMaxDamage[1] * attacker.moves[n].hits;
            var minPercentage = Math.floor(minDamage * 1000 / defender.maxHP()) / 10;
            var maxPercentage = Math.floor(maxDamage * 1000 / defender.maxHP()) / 10;
            
            // Only consider moves that deal damage
            if (maxPercentage > 0) {
                var avgPercentage = (minPercentage + maxPercentage) / 2;
                pokemonDamageStats[pokemonId].totalDamage += avgPercentage;
                pokemonDamageStats[pokemonId].moveCount++;
                pokemonDamageStats[pokemonId].maxDamage = Math.max(pokemonDamageStats[pokemonId].maxDamage, maxPercentage);
            }

            var moveName = attacker.moves[n].name.replace("Hidden Power", "HP");
            var moveType = attacker.moves[n].type;
            var effectiveBP = attacker.moves[n].bp * attacker.moves[n].hits;

            var moveData = baseInfo.slice();
            moveData.push((mode === "one-vs-all") ? defender.types[0] : attacker.types[0]); // Type 1
            moveData.push(((mode === "one-vs-all") ? defender.types[1] : attacker.types[1]) || ""); // Type 2
            moveData.push(moveName + " (" + moveType + ")");  // Best Move
            moveData.push(effectiveBP + " BP");  // Base Power (BP)
            moveData.push(minPercentage + " - " + maxPercentage + "%");  // Damage %
            moveData.push(result.kochance(false).text);  // KO chance
            moveData.push(((mode === "one-vs-all") ? defender.ability : attacker.ability) || ""); // Ability
            moveData.push(((mode === "one-vs-all") ? defender.item : attacker.item) || ""); // Item
            
            dataSet.push(moveData);
        }
    }

    var secondaryData = [];
    for (var pokemon in pokemonDamageStats) {
        var stats = pokemonDamageStats[pokemon];
        
        if (mode === "one-vs-all") {
            var avgDamage = stats.moveCount > 0 ? stats.totalDamage / stats.moveCount : 0;
            if (avgDamage < 50) {
                secondaryData.push([
                    pokemon.split(" (")[0],
                    stats.types[0],
                    stats.types[1] || "",
                    avgDamage.toFixed(1) + "%"
                ]);
            }
        } else {
            if (stats.maxDamage >= 75) {
                secondaryData.push([
                    pokemon.split(" (")[0],
                    stats.types[0],
                    stats.types[1] || "",
                    stats.maxDamage.toFixed(1) + "%"
                ]);
            }
        }
    }
    
    secondaryData.sort(function(a, b) {
        var aValue = parseFloat(a[3]);
        var bValue = parseFloat(b[3]);
        return mode === "one-vs-all" ? aValue - bValue : bValue - aValue;
    });

    var pokemon = mode === "one-vs-all" ? attacker : defender;
    if (pokemon) pokeInfo.find(".sp .totalMod").text(pokemon.stats.spe);
    table.rows.add(dataSet).draw();
    checksTable.rows.add(secondaryData).draw();
}