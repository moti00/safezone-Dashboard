import { mockData } from './mockData.js';

let drawMap = null;
let drawLayer = null;

export function initializeAlertAreas() {
    renderAlertAreasTable();
    
    const createAlertAreaBtn = document.getElementById('create-alert-area-btn');
    const alertAreaForm = document.getElementById('alert-area-form');
    const alertAreaModal = document.getElementById('alert-area-modal');
    const closeButtons = alertAreaModal.querySelectorAll('.close-btn, .modal-cancel');
    const alertActivationForm = document.getElementById('alert-activation-form');
    const alertActivationModal = document.getElementById('alert-activation-modal');
    const activationCloseButtons = alertActivationModal.querySelectorAll('.close-btn, .modal-cancel');
    
    // Create alert area button
    createAlertAreaBtn.addEventListener('click', () => {
        document.getElementById('alert-area-form').reset();
        document.getElementById('edit-area-id').value = '';
        document.querySelector('.modal-header h2').textContent = 'צור אזור התרעה';
        document.getElementById('alert-text-container').style.display = 'block';
        alertAreaModal.classList.add('active');
        initializeDrawMap();
        toggleCustomAlertField();
    });
    
    // Setup alert text field toggle
    const alertTextSelect = document.getElementById('alert-text');
    alertTextSelect.addEventListener('change', toggleCustomAlertField);
    
    // Setup activation alert text field toggle
    const activationAlertTextSelect = document.getElementById('activation-alert-text');
    activationAlertTextSelect.addEventListener('change', toggleActivationCustomAlertField);
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add a timeout to allow the animation to complete
            setTimeout(() => {
                alertAreaModal.classList.remove('active');
            }, 50);
        });
    });

    // Close activation modal buttons
    activationCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add a timeout to allow the animation to complete
            setTimeout(() => {
                alertActivationModal.classList.remove('active');
            }, 50);
        });
    });
    
    // Form submission
    alertAreaForm.addEventListener('submit', handleAlertAreaSubmit);
    
    // Alert activation form submission
    alertActivationForm.addEventListener('submit', handleAlertActivationSubmit);
    
    // Initialize toggles
    toggleCustomAlertField();
    toggleActivationCustomAlertField();
}

// Render the alert areas table
function renderAlertAreasTable() {
    const alertAreasTable = document.getElementById('alert-areas-table');
    alertAreasTable.innerHTML = '';
    
    mockData.alertAreas.forEach(area => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = area.name;
        
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('action-buttons');
        actionsCell.style.display = 'flex';
        actionsCell.style.justifyContent = 'space-between';
        
        // Create a container for edit and delete buttons
        const editDeleteContainer = document.createElement('div');
        editDeleteContainer.style.display = 'flex';
        editDeleteContainer.style.gap = '0.25rem';
        editDeleteContainer.classList.add('alert-actions-container');
        
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-icon');
        editBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-icon');
        deleteBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        
        const alertBtn = document.createElement('button');
        alertBtn.classList.add('btn', 'btn-danger');
        alertBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> הפעלת התרעה';
        
        editBtn.addEventListener('click', () => editAlertArea(area));
        deleteBtn.addEventListener('click', () => showConfirmDialog(
            'מחיקת אזור התרעה',
            `האם אתה בטוח שברצונך למחוק את אזור ההתרעה "${area.name}"?`,
            () => deleteAlertArea(area.id)
        ));
        alertBtn.addEventListener('click', () => activateAlert(area.id)); // Directly open activation modal without confirmation
        
        // Add edit and delete buttons to their container
        editDeleteContainer.appendChild(editBtn);
        editDeleteContainer.appendChild(deleteBtn);
        
        // Add both containers to the actions cell
        actionsCell.appendChild(editDeleteContainer);
        actionsCell.appendChild(alertBtn);
        
        row.appendChild(nameCell);
        row.appendChild(actionsCell);
        
        alertAreasTable.appendChild(row);
    });
}

// Initialize the drawing map
function initializeDrawMap() {
    if (drawMap) {
        drawMap.remove();
    }
    
    if (window.L) {
        const drawMapContainer = document.getElementById('draw-map-container');
        
        drawMap = L.map(drawMapContainer, {
            center: [32.07, 34.78], // Tel Aviv area
            zoom: 12,
            zoomControl: false
        });
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(drawMap);
        
        L.control.zoom({
            position: 'topright'
        }).addTo(drawMap);
        
        if (window.L.Draw) {
            drawLayer = new L.FeatureGroup();
            drawMap.addLayer(drawLayer);
            
            const drawControl = new L.Control.Draw({
                draw: {
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polygon: true
                },
                edit: {
                    featureGroup: drawLayer
                }
            });
            drawMap.addControl(drawControl);
            
            drawMap.on(L.Draw.Event.CREATED, function(e) {
                drawLayer.clearLayers();
                drawLayer.addLayer(e.layer);
            });
        } else {
            console.error('Leaflet.Draw is not loaded');
        }
        
        setTimeout(() => {
            drawMap.invalidateSize();
        }, 100);
    } else {
        console.error('Leaflet is not loaded');
    }
}

// Handle alert area form submission
function handleAlertAreaSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('alert-area-name').value;
    const editAreaId = document.getElementById('edit-area-id').value;
    
    if (drawLayer && drawLayer.getLayers().length === 0) {
        alert('יש לצייר אזור על המפה');
        return;
    }
    
    let polygon = null;
    if (drawLayer && drawLayer.getLayers().length > 0) {
        const layer = drawLayer.getLayers()[0];
        const latLngs = layer.getLatLngs()[0];
        const coords = latLngs.map(latlng => [latlng.lng, latlng.lat]);
        
        if (coords.length > 0 && 
            (coords[0][0] !== coords[coords.length-1][0] || 
             coords[0][1] !== coords[coords.length-1][1])) {
            coords.push(coords[0]);
        }
        
        polygon = {
            type: 'Polygon',
            coordinates: [coords]
        };
    }
    
    if (editAreaId) {
        const areaIndex = mockData.alertAreas.findIndex(area => area.id === parseInt(editAreaId));
        if (areaIndex !== -1) {
            mockData.alertAreas[areaIndex].name = name;
            if (polygon) {
                mockData.alertAreas[areaIndex].polygon = polygon;
            }
        }
    } else {
        const newArea = {
            id: mockData.alertAreas.length + 1,
            name: name,
            polygon: polygon
        };
        
        mockData.alertAreas.push(newArea);
    }
    
    renderAlertAreasTable();
    setTimeout(() => {
        document.getElementById('alert-area-modal').classList.remove('active');
    }, 50);
    document.getElementById('alert-area-form').reset();
    document.getElementById('edit-area-id').value = '';
    document.querySelector('.modal-header h2').textContent = 'צור אזור התרעה';
    document.getElementById('alert-text-container').style.display = 'block';
    toggleCustomAlertField();
}

// Edit alert area
function editAlertArea(area) {
    document.getElementById('alert-area-name').value = area.name;
    document.getElementById('alert-area-modal').classList.add('active');
    document.querySelector('.modal-header h2').textContent = 'ערוך אזור התרעה';
    
    initializeDrawMap();
    
    setTimeout(() => {
        if (drawMap && area.polygon && area.polygon.coordinates && area.polygon.coordinates[0]) {
            const latLngs = area.polygon.coordinates[0].map(point => L.latLng(point[1], point[0]));
            
            const polygon = L.polygon(latLngs);
            drawLayer.addLayer(polygon);
            
            drawMap.fitBounds(polygon.getBounds());
        }
    }, 1000);
}

// Delete alert area
function deleteAlertArea(areaId) {
    mockData.alertAreas = mockData.alertAreas.filter(area => area.id !== areaId);
    renderAlertAreasTable();
}

// Activate alert (mock implementation)
function activateAlert(areaId) {
    const area = mockData.alertAreas.find(a => a.id === areaId);
    
    const alertActivationModal = document.getElementById('alert-activation-modal');
    document.getElementById('alert-area-id').value = areaId;
    document.getElementById('alert-area-name-display').textContent = area.name;
    
    alertActivationModal.classList.add('active');
}

// Handle alert activation form submission
function handleAlertActivationSubmit(e) {
    e.preventDefault();
    
    const areaId = parseInt(document.getElementById('alert-area-id').value);
    const alertText = document.getElementById('activation-alert-text').value;
    const customText = document.getElementById('activation-alert-text-custom').value;
    
    const finalAlertText = alertText === 'other' ? (customText || 'התרעה כללית') : alertText;
    
    alert(`התרעה הופעלה באזור: ${mockData.alertAreas.find(a => a.id === areaId).name}\nסיבת התרעה: ${finalAlertText}`);
    
    setTimeout(() => {
        document.getElementById('alert-activation-modal').classList.remove('active');
    }, 50);
}

// Show confirmation dialog
function showConfirmDialog(title, message, onConfirm) {
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmOkBtn = document.getElementById('confirm-ok');
    
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    confirmOkBtn.onclick = () => {
        onConfirm();
        setTimeout(() => {
            confirmDialog.classList.remove('active');
        }, 50);
    };
    
    confirmDialog.classList.add('active');
    
    confirmDialog.querySelectorAll('.close-btn, .modal-cancel').forEach(btn => {
        btn.onclick = () => {
            setTimeout(() => {
                confirmDialog.classList.remove('active');
            }, 50);
        };
    });
}

// Toggle custom alert field based on selection
function toggleCustomAlertField() {
    const alertTextSelect = document.getElementById('alert-text');
    const customField = document.getElementById('alert-text-custom');
    
    if (alertTextSelect.value === 'other') {
        customField.style.display = 'block';
        customField.required = true;
    } else {
        customField.style.display = 'none';
        customField.required = false;
    }
}

// Toggle custom alert field for activation modal
function toggleActivationCustomAlertField() {
    const alertTextSelect = document.getElementById('activation-alert-text');
    const customField = document.getElementById('activation-alert-text-custom');
    const container = document.querySelector('.alert-text-field-container');
    
    if (alertTextSelect.value === 'other') {
        customField.style.display = 'block';
        customField.required = false;
        alertTextSelect.style.flex = '0.4';
        customField.style.flex = '0.6';
    } else {
        customField.style.display = 'none';
        customField.required = false;
        alertTextSelect.style.flex = '1';
        alertTextSelect.style.width = '100%';
    }
}