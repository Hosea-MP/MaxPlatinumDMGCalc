document.addEventListener('DOMContentLoaded', function() {

  if (typeof SETDEX_SV === 'undefined') {
    console.error('SETDEX_SV is not defined. Make sure that hardcore.js is loaded before this script.');
    return;
  }

  var trainerPokemonMap = {};

  for (var pokemon in SETDEX_SV) {
    for (var trainer in SETDEX_SV[pokemon]) {
      if (!trainerPokemonMap[trainer]) {
        trainerPokemonMap[trainer] = [];
      }
      trainerPokemonMap[trainer].push(pokemon);
    }
  }

  var progressionSelect = document.getElementById('progression-select');
  if (progressionSelect) {
    for (var trainer in trainerPokemonMap) {
      var option = document.createElement('option');
      option.value = trainer;
      option.text = trainer;
      progressionSelect.appendChild(option);
    }
  }

  progressionSelect.addEventListener('change', function() {
    var selectedTrainer = this.value;
    displayTrainerPokemon(selectedTrainer);
  });

  if (progressionSelect.options.length > 0) {
    progressionSelect.selectedIndex = 0;
    var selectedTrainer = progressionSelect.value;
    displayTrainerPokemon(selectedTrainer);
  }

  function displayTrainerPokemon(trainer) {
    var gridContainer = document.getElementById('trainer-pokemon-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; 

    var pokemonList = trainerPokemonMap[trainer];
    if (!pokemonList) return;

    pokemonList.forEach(function(pokemonName) {

      var pokemonButton = document.createElement('button');
      pokemonButton.innerText = pokemonName;
      pokemonButton.classList.add('pokemon-grid-item');

      pokemonButton.addEventListener('click', function() {

        var selectedItems = gridContainer.getElementsByClassName('selected');
        Array.from(selectedItems).forEach(function(item) {
          item.classList.remove('selected');
        });

        this.classList.add('selected');

        populatePokemonInfo(trainer, pokemonName);
      });

      gridContainer.appendChild(pokemonButton);
    });
  }

  function populatePokemonInfo(trainer, pokemonName) {
    var setData = SETDEX_SV[pokemonName][trainer];
    if (!setData) return;

    var pokeInfoPanel = document.getElementById('p1');
    if (!pokeInfoPanel) return;

    var setSelector = $(pokeInfoPanel).find('.set-selector');
    setSelector.val(pokemonName).trigger('change');

    var levelInput = $(pokeInfoPanel).find('.level');
    levelInput.val(setData.level).trigger('keyup');

    var natureSelect = $(pokeInfoPanel).find('.nature');
    natureSelect.val(setData.nature).trigger('change');

    var abilitySelect = $(pokeInfoPanel).find('.ability');
    abilitySelect.val(setData.ability).trigger('change');

    var itemSelect = $(pokeInfoPanel).find('.item');
    itemSelect.val(setData.item || '').trigger('change');

    for (var i = 0; i < 4; i++) {
      var moveSelector = $(pokeInfoPanel).find('.move' + (i + 1) + ' .move-selector');
      moveSelector.val(setData.moves[i] || '(No Move)').trigger('change');
    }

    updateStats(pokeInfoPanel, pokemonName);
  }

  function updateStats(pokeInfoPanel, pokemonName) {

    if (typeof POKEDEX_SV === 'undefined') {
      console.error('POKEDEX_SV is not defined. Make sure that species.js is loaded before this script.');
      return;
    }

    var baseStats = POKEDEX_SV[pokemonName] ? POKEDEX_SV[pokemonName].bs : null;
    if (!baseStats) {
      console.error('Base stats not found for ' + pokemonName);
      return;
    }

    var stats = ['hp', 'at', 'df', 'sa', 'sd', 'sp'];
    stats.forEach(function(stat) {
      var baseInput = $(pokeInfoPanel).find('.' + stat + ' .base');
      baseInput.val(baseStats[stat.toUpperCase()]).trigger('keyup');
    });
  }
});