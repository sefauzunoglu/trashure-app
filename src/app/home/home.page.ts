import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType } from '@capacitor/camera';

// Marker ikon yolunu özelleştirin
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41], // Varsayılan boyut
  iconAnchor: [12, 41], // Simgenin ucunun yerle temas ettiği nokta
  popupAnchor: [1, -34], // Popup'ın nerede görüneceği
  shadowSize: [41, 41], // Gölge boyutu
});



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit {
  private map: L.Map;
  // Kirli noktaların listesi
  private dirtyLocations = [
    { lat: 51.505, lng: -0.09, description: 'Kirlilik 1: Plastik atıklar' },
    { lat: 51.51, lng: -0.1, description: 'Kirlilik 2: Cam şişeler' },
    { lat: 51.515, lng: -0.08, description: 'Kirlilik 3: Kağıt atıklar' },
  ];

  private trashLocations: { lat: number; lng: number; photo: string }[] = []; // Çöp noktalarını saklamak için

  constructor() { }

  async ngAfterViewInit() {
    const position = await Geolocation.getCurrentPosition();
    this.initMap(position.coords.latitude, position.coords.longitude);

    // Haritaya kirli noktaları ekle
    this.addDirtyMarkers();
  }

  private initMap(lat: number, lng: number): void {
    this.map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup('You are here!')
      .openPopup();

    // Harita üzerine tıklanabilirlik eklemek için
    this.map.on('click', (e: any) => {
      this.addTrashMarker(e.latlng.lat, e.latlng.lng);
    });
  }

  async onAddTrash() {
    // Kamera ile fotoğraf çek
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });

    // Fotoğrafı geçici olarak sakla
    const photoUrl = photo.dataUrl || '';
    alert('Haritada çöp alanını seçmek için bir yere tıklayın!');
    this.trashLocations.push({ lat: 0, lng: 0, photo: photoUrl }); // Geçici olarak koordinatları 0 ekleriz
  }

  // Haritaya çöp işaretçisi eklemek
  private addTrashMarker(lat: number, lng: number): void {
    const lastPhoto = this.trashLocations[this.trashLocations.length - 1]?.photo || '';

    // Son eklenen çöp noktasının koordinatlarını güncelle
    this.trashLocations[this.trashLocations.length - 1] = { lat, lng, photo: lastPhoto };

    // Çöp için özel ikon
    const trashIcon = L.icon({
      iconUrl: 'assets/trash2.png', // Özel ikon dosyası
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Çöp işaretçisini haritaya ekle
    const marker = L.marker([lat, lng], { icon: trashIcon }).addTo(this.map);

    // İşaretçiye popup ekle (Fotoğraf ve açıklama ile)
    marker.bindPopup(`
        <p>Çöp Alanı</p>
        <img src="${lastPhoto}" alt="Trash" style="width:100px;height:auto;">
      `);
  }

  private addDirtyMarkers(): void {
    // Özel ikon tanımı
    const trashIcon = L.icon({
      iconUrl: 'assets/trash2.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
    // Her kirli noktayı haritaya ekle
    this.dirtyLocations.forEach(location => {
      const marker = L.marker([location.lat, location.lng], { icon: trashIcon }).addTo(this.map);
      marker.bindPopup(location.description); // Açıklama ekler
    });
  }
}
