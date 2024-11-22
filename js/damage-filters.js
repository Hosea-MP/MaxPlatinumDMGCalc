$.fn.dataTable.ext.search.push(
	function(settings, data, dataIndex) {

		const dealtOperator = $('#damage-dealt-operator').val();
		const dealtValue = parseFloat($('#damage-dealt-value').val());
		const receivedOperator = $('#damage-received-operator').val();
		const receivedValue = parseFloat($('#damage-received-value').val());

		const dealtDamageStr = data[2];
		const receivedDamageStr = data[4];

		const [dealtMin, dealtMax] = dealtDamageStr
			.replace('%', '')
			.split(' - ')
			.map(Number);

		const [receivedMin, receivedMax] = receivedDamageStr
			.replace('%', '')
			.split(' - ')
			.map(Number);

		let includeDealt = true;
		if (!isNaN(dealtValue)) {
			if (dealtOperator === 'gt') {

				includeDealt = dealtMin >= dealtValue;
			} else {

				includeDealt = dealtMax <= dealtValue;
			}
		}

		let includeReceived = true;
		if (!isNaN(receivedValue)) {
			if (receivedOperator === 'gt') {

				includeReceived = receivedMin >= receivedValue;
			} else {

				includeReceived = receivedMax <= receivedValue;
			}
		}

		return includeDealt && includeReceived;
	}
);

$(document).ready(function() {

	$('#apply-damage-filters').click(function() {
		table.draw();
	});

	$('#reset-damage-filters').click(function() {
		$('#damage-dealt-operator').val('gt');
		$('#damage-dealt-value').val('');
		$('#damage-received-operator').val('gt');
		$('#damage-received-value').val('');
		table.draw();
	});

	$('#damage-dealt-value, #damage-received-value').on('keypress', function(e) {
		if (e.which === 13) {
			table.draw();
		}
	});

	$('#damage-dealt-value, #damage-received-value').on('input', function() {
		let value = parseFloat($(this).val());
		if (value < 0) $(this).val(0);
		if (value > 100) $(this).val(100);
	});
});