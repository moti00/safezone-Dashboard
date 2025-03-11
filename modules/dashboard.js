import { mockData } from './mockData.js';

let map = null;
let markers = [];

export function initializeDashboard() {
    const dashboardLink = document.querySelector('.sidebar nav li[data-page="dashboard"]');
    
    dashboardLink.addEventListener('click', () => {
        if (!map) {
            initializeMap();
        } else {
            // Trigger a resize event to ensure the map fills the container properly
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    });
    
    // Initialize on first load if dashboard is active
    if (document.getElementById('dashboard-page').classList.contains('active')) {
        initializeMap();
    }

    // Handle window resize to adjust map size
    window.addEventListener('resize', () => {
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
}

// Initialize the main map
function initializeMap() {
    if (map) return;
    
    // Use Leaflet instead of Mapbox
    if (window.L) {
        const mapContainer = document.getElementById('map-container');
        
        map = L.map(mapContainer, {
            center: [32.07, 34.78], // Tel Aviv area
            zoom: 12,
            zoomControl: false
        });
        
        // Add dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Add zoom control to top-right
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Add alert areas as polygons
        mockData.alertAreas.forEach(area => {
            const coords = area.polygon.coordinates[0].map(point => [point[1], point[0]]);
            
            L.polygon(coords, {
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map);
        });
        
        // Add user markers
        addUserMarkers();
        
        // Trigger resize to ensure proper rendering
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } else {
        console.error('Leaflet is not loaded');
    }
}

// Add user location markers to the map
function addUserMarkers() {
    // Remove existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Add new markers
    mockData.userLocations.forEach(location => {
        // Create custom marker icon based on status
        let markerColor;
        switch (location.status) {
            case 'red': markerColor = 'var(--danger-color)'; break;
            case 'yellow': markerColor = 'var(--warning-color)'; break;
            case 'green': markerColor = 'var(--success-color)'; break;
            default: markerColor = 'var(--gray-dark)';
        }
        
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${markerColor}; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        // Add marker to map
        const marker = L.marker([location.lat, location.lng], {
            icon: customIcon
        }).addTo(map);
        
        // Add popup
        marker.bindPopup(`<strong>${location.username}</strong><br>סטטוס: ${getStatusText(location.status)}`);
        
        markers.push(marker);
    });
}

// Get text representation of status
function getStatusText(status) {
    switch (status) {
        case 'red': return 'אני בסכנה';
        case 'yellow': return 'אני באזור מסוכן אבל אני בסדר';
        case 'green': return 'אני באזור בטוח';
        default: return 'לא הגיב עדיין';
    }
}