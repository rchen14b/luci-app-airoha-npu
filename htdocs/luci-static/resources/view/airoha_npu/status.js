'use strict';
'require view';
'require poll';
'require rpc';
'require ui';

var callNpuStatus = rpc.declare({
	object: 'luci.airoha_npu',
	method: 'getStatus'
});

var callPpeEntries = rpc.declare({
	object: 'luci.airoha_npu',
	method: 'getPpeEntries'
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPackets(packets) {
	if (packets === 0) return '0';
	if (packets >= 1000000) return (packets / 1000000).toFixed(2) + 'M';
	if (packets >= 1000) return (packets / 1000).toFixed(2) + 'K';
	return packets.toString();
}

return view.extend({
	load: function() {
		return Promise.all([
			callNpuStatus(),
			callPpeEntries()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var ppeData = data[1] || {};
		var entries = Array.isArray(ppeData.entries) ? ppeData.entries : [];
		var memRegions = Array.isArray(status.memory_regions) ? status.memory_regions : [];

		// Calculate total memory size from regions
		var totalMemory = 0;
		memRegions.forEach(function(region) {
			var sizeStr = region.size || '';
			var match = sizeStr.match(/(\d+)\s*(KiB|MiB|GiB|KB|MB|GB)/i);
			if (match) {
				var size = parseInt(match[1]);
				var unit = match[2].toUpperCase();
				if (unit === 'KIB' || unit === 'KB') totalMemory += size;
				else if (unit === 'MIB' || unit === 'MB') totalMemory += size * 1024;
				else if (unit === 'GIB' || unit === 'GB') totalMemory += size * 1024 * 1024;
			}
		});
		var totalMemoryStr = totalMemory >= 1024 ? (totalMemory / 1024).toFixed(0) + ' MiB' : totalMemory + ' KiB';

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Airoha NPU Status')),

			// NPU Information Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('NPU Information')),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'width': '33%' }, E('strong', {}, _('NPU Firmware Version'))),
						E('td', { 'class': 'td' }, status.npu_version || _('Not available'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, E('strong', {}, _('NPU Status'))),
						E('td', { 'class': 'td' }, status.npu_loaded ?
							E('span', { 'class': 'label-success' }, _('Active') + (status.npu_device ? ' (' + status.npu_device + ')' : '')) :
							E('span', { 'class': 'label-danger' }, _('Not Active')))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, E('strong', {}, _('NPU Clock / Cores'))),
						E('td', { 'class': 'td' }, (status.npu_clock ? (status.npu_clock / 1000000).toFixed(0) + ' MHz' : 'N/A') + ' / ' + (status.npu_cores || 0) + ' cores')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, E('strong', {}, _('Reserved Memory'))),
						E('td', { 'class': 'td' }, totalMemoryStr + ' (' + memRegions.length + ' regions)')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, E('strong', {}, _('Offload Statistics'))),
						E('td', { 'class': 'td' }, formatPackets(status.offload_packets || 0) + ' packets / ' + formatBytes(status.offload_bytes || 0))
					])
				])
			]),

			// PPE Flow Offload Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('PPE Flow Offload Entries')),
				E('div', { 'class': 'cbi-section-descr' },
					_('Total: ') + entries.length + ' | ' +
					_('Bound: ') + entries.filter(function(e) { return e.state === 'BND'; }).length + ' | ' +
					_('Unbound: ') + entries.filter(function(e) { return e.state === 'UNB'; }).length
				),
				E('table', { 'class': 'table', 'id': 'ppe-entries-table' }, [
					E('tr', { 'class': 'tr cbi-section-table-titles' }, [
						E('th', { 'class': 'th' }, _('Index')),
						E('th', { 'class': 'th' }, _('State')),
						E('th', { 'class': 'th' }, _('Type')),
						E('th', { 'class': 'th' }, _('Original Flow')),
						E('th', { 'class': 'th' }, _('New Flow')),
						E('th', { 'class': 'th' }, _('Ethernet')),
						E('th', { 'class': 'th' }, _('Packets')),
						E('th', { 'class': 'th' }, _('Bytes'))
					])
				].concat(entries.slice(0, 100).map(function(entry) {
					var stateClass = entry.state === 'BND' ? 'label-success' : '';
					// Format eth: show only non-zero MACs
					var ethDisplay = entry.eth || '';
					if (ethDisplay === '00:00:00:00:00:00->00:00:00:00:00:00') {
						ethDisplay = '-';
					}
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, entry.index),
						E('td', { 'class': 'td' }, E('span', { 'class': stateClass }, entry.state)),
						E('td', { 'class': 'td' }, entry.type),
						E('td', { 'class': 'td' }, entry.orig || '-'),
						E('td', { 'class': 'td' }, entry.new_flow || '-'),
						E('td', { 'class': 'td' }, ethDisplay),
						E('td', { 'class': 'td' }, formatPackets(entry.packets || 0)),
						E('td', { 'class': 'td' }, formatBytes(entry.bytes || 0))
					]);
				})))
			])
		]);

		// Setup polling for live updates
		poll.add(L.bind(function() {
			return Promise.all([
				callNpuStatus(),
				callPpeEntries()
			]).then(L.bind(function(data) {
				// Update status fields
				var status = data[0] || {};
				// Could add dynamic updates here
			}, this));
		}, this), 5);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
