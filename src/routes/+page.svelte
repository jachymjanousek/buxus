<script>
	import { onMount } from "svelte";
	import { MapLibre, FullScreenControl, GeoJSONSource, LineLayer, Marker, FillLayer, Popup, CircleLayer, HeatmapLayer } from "svelte-maplibre-gl";

	let date = $state("2025-02-01");
	let geojson = $state({});

	async function loadData() {
		const YYYYMMDD = date.split("-").join("");
		geojson = await import(`./api/records/${YYYYMMDD}.json`);
		console.log(geojson);
	}

	onMount(async () => {
		await loadData();
	});

	const style = {
		version: 8,
		sources: {
			osm: {
				type: "raster",
				tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
				tileSize: 256,
				attribution: "&copy; OpenStreetMap Contributors",
				maxzoom: 16,
			},
		},
		layers: [
			{
				id: "osm",
				type: "raster",
				source: "osm", // This must match the source key above
			},
		],
	};
	const initialState = {
		center: [15.4749126, 49.8037633],
		zoom: 6.5,
	};
	let map = $state.raw();

	let heatmap = $state(false);
	let lineColor = $state("#ff00dd");
	let lineWidth = $state(1.5);
	let clickedName = $state("");
	let circleRadius = $state(15);
	let pointColor = $state("#00000033");
	let manual = $state(false);
	let opacity = $state(0.5);
	let radius = $state(15);
	let showHeatmap = $state(false);

	let zoom = $state(6.5);
	let center = $state([15.4749126, 49.8037633]);

	const markers = [];

	function zoomTo(evt) {
		let { lngLat } = evt;
		console.log(evt);

		map.flyTo({
			center: lngLat,
			zoom: 9,
			duration: 2000,
		});
	}

	// increase the size of the circle based on the zoom level
	function calculateSizeByZoom() {
		return Math.pow(2, zoom - 10) * 150;
	}

	const colorScale = ["case", ["==", ["get", "risk"], 1], "#53AFDC", ["==", ["get", "risk"], 2], "#C89F38", ["==", ["get", "risk"], 3], "#FE7F6E", "#F9FAFB"];

	function randomRisk() {
		const risks = ["low", "medium", "high"];
		return risks[Math.floor(Math.random() * risks.length)];
	}

	async function prevDay() {
		date = new Date(date);
		date.setDate(date.getDate() - 1);
		date = date.toISOString().split("T")[0];
		console.log(date);

		await loadData();
	}

	async function nextDay() {
		console.log(date);
		date = new Date(date);
		date.setDate(date.getDate() + 1);
		date = date.toISOString().split("T")[0];
		console.log(date);
		await loadData();
	}

	let source;
</script>

<div class="container flex flex-col gap-4 mx-auto my-4">
	<h1 class="text-3xl font-bold text-white mb-2">Boxwood Pest risk</h1>
	<form class="grid grid-cols-1 justify-stretch gap-4 flex-wrap align-stretch">
		<div class="flex flex-1 gap-4 grow">
			<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={prevDay}>Předchozí den</button>
			<label for="date" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Datum</label>
			<div class="relative flex-1">
				<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
						<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
					</svg>
				</div>
				<input
					type="date"
					id="date"
					class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					placeholder="YYYY-MM-DD"
					datepicker-format
					aria-label="Načíst data"
					required
					bind:value={date}
				/>
				<button type="submit" class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={loadData}
					>Načíst Data</button
				>
			</div>
			<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={nextDay}>Další den</button>
		</div>
		<div class="flex gap-4 flex-1 grow">
			<div class="flex items-center mb-4">
				<input id="heatmap" type="checkbox" bind:checked={showHeatmap} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
				<label for="heatmap" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{showHeatmap ? "Skrýt heatmap" : "Zobrazit heatmap"} (Experimentální)</label>
			</div>

			<!-- <button
				type="button"
				class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				onclick={() => {
					manual = !manual;
				}}
			>
				{manual ? "Automatická" : "Manuální"} velikost
			</button> -->
		</div>
	</form>

	<div class="risk range flex justify-stretch">
		<div class="flex-1 text-center py-1 bg-[#53AFDC]">Nízké riziko</div>
		<div class="flex-1 text-center py-1 bg-[#C89F38]">Střední riziko</div>
		<div class="flex-1 text-center py-1 bg-[#FE7F6E]">Vysoké riziko</div>
	</div>

	<!-- <p class="text-white">{zoom}</p> -->
	<MapLibre class="h-[75vh] min-h-[300px] border-8 border-slate-500" {style} {...initialState} bind:map bind:zoom bind:center>
		<FullScreenControl position="top-left" />
		<GeoJSONSource data="okresy.geojson">
			<LineLayer
				layout={{ "line-cap": "round", "line-join": "round" }}
				paint={{
					"line-width": 2,
					"line-dasharray": [5, 2],
					"line-color": "#000000",
					"line-opacity": 0.3,
				}}
			/>
			<FillLayer
				paint={{
					"fill-color": "#000",
					"fill-opacity": 0.1,
				}}
				beforeLayerType="symbol"
				manageHoverState
				onclick={zoomTo}
			/>
		</GeoJSONSource>

		<GeoJSONSource data={geojson}>
			<Popup openOn="click" offset={[0, -10]}>
				<div class="text-lg font-bold">{clickedName}</div>
			</Popup>
			<CircleLayer
				metadata
				paint={{
					"circle-radius": manual ? radius : calculateSizeByZoom(),
					"circle-color": colorScale,
					"circle-opacity": opacity,
				}}
				layout={{
					visibility: "visible",
				}}
				onclick={zoomTo}
			/>
		</GeoJSONSource>
		{#if showHeatmap}
			<GeoJSONSource data={geojson}>
				<HeatmapLayer
					paint={{
						"heatmap-weight": 1,
						"heatmap-intensity": ["interpolate", ["exponential", 2], ["zoom"], 0, 0.9, 18, 10],
						"heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.7, "rgb(239,138,98)", 0.9, "rgb(178,24,43)", 1, "rgb(100,0,200)"],
						"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 18, 20],
						"heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 2, 1, 18, 0],
					}}
				/>
			</GeoJSONSource>
		{/if}

		{#each markers as { lngLat, label, name } (label)}
			<Marker {lngLat} onclick={() => (clickedName = name)} class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-red-300 text-black shadow-2xl focus:outline-2 focus:outline-black">
				<span>
					{label}
				</span>

				<Popup openOn="hover" offset={[0, -10]}>
					<div class="text-lg font-bold">{name}</div>
				</Popup>
			</Marker>
		{/each}
	</MapLibre>
	{#if source}
		<pre class="text-white">{JSON.stringify(source, null, 4)}</pre>
	{/if}
</div>
