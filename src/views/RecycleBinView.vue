<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import { useAuthStore } from "../stores/auth";
import { useRecycleSessionStore } from "../stores/recycle";
import { checkRecyclePassword, closeRecyclePasswordWindow, listRecycleAlbums, listRecyclePhotos, loadRecyclePhotoPreview, openRecyclePasswordWindow, recoverRecyclePhotos } from "../utils/qzone";

interface Album { id: string; name: string; cover?: string; count: number }
interface Photo { id: string; sourceAlbumId: string; targetAlbumId: string; name: string; url?: string; deletedAt?: string }
const auth = useAuthStore();
const recycleSession = useRecycleSessionStore();
const { pwd2sig: token, ownerUin } = storeToRefs(recycleSession);
const verifying = ref(false);
const loading = ref(false);
const recovering = ref(false);
const error = ref("");
const albums = ref<Album[]>([]);
const photos = ref<Photo[]>([]);
const activeAlbumId = ref("");
const selectedIds = ref<string[]>([]);
const confirmVisible = ref(false);
let verifyRun = 0;
const verified = computed(() => Boolean(token.value));
const allSelected = computed(() => photos.value.length > 0 && selectedIds.value.length === photos.value.length);
const activeAlbum = computed(() => albums.value.find((item) => item.id === activeAlbumId.value));
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const object = (value: unknown) => value && typeof value === "object" ? value as Record<string, unknown> : {};
function values(response: Record<string, unknown>, names: string[]) {
  const data = object(response.data);
  for (const name of names) { const value = data[name] ?? response[name]; if (Array.isArray(value)) return value.map(object); }
  return [];
}
function field(item: Record<string, unknown>, names: string[]) {
  for (const name of names) if (item[name] != null) return String(item[name]);
  return "";
}
function mapAlbums(response: Record<string, unknown>): Album[] {
  return values(response, ["album", "albums", "albumList"]).map((item) => ({ id: field(item, ["albumid", "albumId", "id"]), name: field(item, ["name", "albumname", "title"]) || "未命名相册", cover: field(item, ["pre", "cover", "coverUrl"]) || undefined, count: Number(field(item, ["num", "photoNum", "total"]) || 0) })).filter((item) => item.id);
}
function mapPhotos(response: Record<string, unknown>, albumId: string): Photo[] {
  return values(response, ["photo", "photos", "photoList", "list"]).map((item) => ({ id: field(item, ["lloc", "photoId", "photoid", "id"]), sourceAlbumId: field(item, ["albumid", "albumId"]) || albumId, targetAlbumId: field(item, ["albumid_orig", "albumIdOrig", "originalAlbumId"]), name: field(item, ["name", "photoName", "title"]) || "照片", url: field(item, ["pre", "url", "origin_url", "rawUrl"]) || undefined, deletedAt: field(item, ["modifytime", "deleteTime", "deltime"]) || undefined })).filter((item) => item.id);
}
async function loadPhotos(albumId = "") {
  loading.value = true; error.value = ""; selectedIds.value = []; activeAlbumId.value = albumId;
  try {
    const mapped = mapPhotos(await listRecyclePhotos(token.value, albumId || undefined), albumId);
    photos.value = mapped;
    photos.value = await Promise.all(mapped.map(async (photo) => {
      if (!photo.url || photo.url.startsWith("data:")) return photo;
      try { return { ...photo, url: await loadRecyclePhotoPreview(photo.url) }; } catch { return photo; }
    }));
  }
  catch (reason) { error.value = String(reason); }
  finally { loading.value = false; }
}
async function loadAll() {
  loading.value = true; error.value = "";
  try { albums.value = mapAlbums(await listRecycleAlbums(token.value)); await loadPhotos(); }
  catch (reason) { error.value = String(reason); loading.value = false; }
}
async function verify() {
  if (!auth.loggedIn) { await auth.openLogin(); return; }
  const run = ++verifyRun; verifying.value = true; error.value = "";
  try {
    await openRecyclePasswordWindow();
    while (run === verifyRun && verifying.value) {
      const result = await checkRecyclePassword();
      if (result) { recycleSession.setVerified(result, auth.user?.uin ?? ""); verifying.value = false; await closeRecyclePasswordWindow(); await loadAll(); return; }
      await delay(1200);
    }
  } catch (reason) { error.value = String(reason); verifying.value = false; }
}
function toggleAll() { selectedIds.value = allSelected.value ? [] : photos.value.map((item) => item.id); }
async function recover() {
  const groups = new Map<string, { sourceAlbumId: string; targetAlbumId: string; ids: string[] }>();
  for (const photo of photos.value.filter((item) => selectedIds.value.includes(item.id))) {
    const key = `${photo.sourceAlbumId}\u0000${photo.targetAlbumId}`;
    const group = groups.get(key) ?? { sourceAlbumId: photo.sourceAlbumId, targetAlbumId: photo.targetAlbumId, ids: [] };
    group.ids.push(photo.id); groups.set(key, group);
  }
  recovering.value = true; error.value = "";
  try {
    for (const group of groups.values()) {
      if (!group.targetAlbumId) throw new Error("照片缺少原相册 ID，无法确定恢复目标");
      await recoverRecyclePhotos(token.value, group.sourceAlbumId, group.targetAlbumId, group.ids);
    }
    confirmVisible.value = false; await loadPhotos(activeAlbumId.value);
  }
  catch (reason) { error.value = String(reason); }
  finally { recovering.value = false; }
}
function resetVerification() { recycleSession.clear(); photos.value = []; albums.value = []; selectedIds.value = []; }
onMounted(() => {
  if (token.value && ownerUin.value === (auth.user?.uin ?? "")) void loadAll();
  else if (token.value) recycleSession.clear();
});
onBeforeUnmount(() => { verifyRun += 1; verifying.value = false; void closeRecyclePasswordWindow(); });
</script>

<template>
  <div class="recycle-page">
    <section v-if="!verified" class="surface-card empty-state recycle-auth-state">
      <span><i class="pi pi-lock" /></span><h2>需要验证 QQ 空间独立密码</h2>
      <p>验证将在独立的内置浏览器窗口中完成。应用不会读取或保存你的密码，只接收腾讯返回的临时验证签名。</p>
      <Button :label="verifying ? '等待验证完成…' : (auth.loggedIn ? '验证独立密码' : '先登录 QQ 空间')" icon="pi pi-shield" :loading="verifying" @click="verify" />
      <small v-if="verifying" class="recycle-auth-tip">请在弹出窗口完成验证，成功后会自动刷新。</small><p v-if="error" class="recycle-error">{{ error }}</p>
    </section>
    <template v-else>
      <section class="surface-card recycle-toolbar">
        <div><h2>相册回收站</h2><p>{{ photos.length }} 张可恢复照片<span v-if="activeAlbum"> · {{ activeAlbum.name }}</span></p></div>
        <div class="recycle-toolbar-actions"><Button label="重新验证" icon="pi pi-key" severity="secondary" text @click="resetVerification" /><Button label="刷新" icon="pi pi-refresh" severity="secondary" :loading="loading" @click="loadAll" /><Button :label="`恢复所选 (${selectedIds.length})`" icon="pi pi-replay" :disabled="!selectedIds.length" @click="confirmVisible = true" /></div>
      </section>
      <p v-if="error" class="surface-card recycle-error">{{ error }}</p>
      <div class="recycle-layout">
        <aside class="surface-card recycle-albums">
          <button :class="{ active: !activeAlbumId }" type="button" @click="loadPhotos()"><i class="pi pi-images" /><span><strong>全部照片</strong><small>所有相册</small></span></button>
          <button v-for="album in albums" :key="album.id" :class="{ active: activeAlbumId === album.id }" type="button" @click="loadPhotos(album.id)"><img v-if="album.cover" :src="album.cover" alt="" /><i v-else class="pi pi-folder" /><span><strong>{{ album.name }}</strong><small>{{ album.count ? `${album.count} 张` : '回收站相册' }}</small></span></button>
        </aside>
        <section class="surface-card recycle-content">
          <div v-if="photos.length" class="recycle-select-row"><Checkbox :model-value="allSelected" binary input-id="select-all-recycle" @update:model-value="toggleAll" /><label for="select-all-recycle">全选当前照片</label></div>
          <div v-if="loading" class="empty-state compact"><span><i class="pi pi-spin pi-spinner" /></span><h4>正在读取回收站</h4></div>
          <div v-else-if="!photos.length" class="empty-state compact"><span><i class="pi pi-check-circle" /></span><h4>回收站中没有照片</h4><p>当前筛选下没有可恢复的照片。</p></div>
          <div v-else class="recycle-photo-grid"><label v-for="photo in photos" :key="photo.id" class="recycle-photo-card" :class="{ selected: selectedIds.includes(photo.id) }"><img v-if="photo.url" :src="photo.url" :alt="photo.name" loading="lazy" /><span v-else class="recycle-photo-placeholder"><i class="pi pi-image" /></span><span class="recycle-photo-check"><Checkbox v-model="selectedIds" :value="photo.id" /></span><span class="recycle-photo-copy"><strong>{{ photo.name }}</strong><small v-if="photo.deletedAt">{{ photo.deletedAt }}</small></span></label></div>
        </section>
      </div>
    </template>
    <Dialog v-model:visible="confirmVisible" modal :closable="!recovering" :draggable="false" class="delete-dialog" header="恢复所选照片？"><p>将恢复 {{ selectedIds.length }} 张照片到原相册。恢复成功后，它们会从回收站列表中移除。</p><template #footer><Button label="取消" severity="secondary" text :disabled="recovering" @click="confirmVisible = false" /><Button label="确认恢复" icon="pi pi-replay" :loading="recovering" @click="recover" /></template></Dialog>
  </div>
</template>
