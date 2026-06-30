import { getHomeData } from '$lib/server/home.js';
import { listGalleryPhotos } from '$lib/server/gallery.js';

export async function load() {
	const home = await getHomeData();
	return { ...home, galleryPhotos: listGalleryPhotos() };
}
