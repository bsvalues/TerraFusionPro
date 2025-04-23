import * as Y from 'yjs';
import { createParcelStore, encodeDocUpdate, applyEncodedUpdate, mergeUpdates, createSnapshot } from '../index';

describe('CRDT functionality', () => {
  test('createParcelStore initializes with empty notes', () => {
    const { store } = createParcelStore('TEST123');
    expect(store.notes).toBe('');
  });

  test('createParcelStore initializes with default metadata', () => {
    const { store } = createParcelStore('TEST123');
    expect(store.metadata.author).toBe('unknown');
    expect(store.metadata.lastModified).toBeDefined();
  });

  test('createParcelStore initializes with empty photos array', () => {
    const { store } = createParcelStore('TEST123');
    expect(Array.isArray(store.photos)).toBe(true);
    expect(store.photos.length).toBe(0);
  });

  test('consistent merge with concurrent note edits', () => {
    // Create two independent stores for the same parcel
    const { store: store1, doc: doc1 } = createParcelStore('TEST123');
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');

    // Make different edits in each store
    store1.notes = 'Update from device 1';
    store2.notes = 'Update from device 2';

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test both merges in different orders
    const { store: storeA, doc: docA } = createParcelStore('TEST123');
    const { store: storeB, doc: docB } = createParcelStore('TEST123');

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both stores should converge to the same state
    expect(storeA.notes).toBe(storeB.notes);
    
    // Final result should contain essence of both updates (actual merge depends on Yjs algorithm)
    const finalResult = storeA.notes;
    expect(
      finalResult.includes('device 1') || finalResult.includes('device 2')
    ).toBeTruthy();
  });

  test('consistent merge with concurrent metadata edits', () => {
    // Create two independent stores for the same parcel
    const { store: store1, doc: doc1 } = createParcelStore('TEST123');
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');

    // Make different edits in each store
    store1.metadata.author = 'Author 1';
    store2.metadata.author = 'Author 2';

    store1.metadata.lastModified = '2023-01-01T00:00:00Z';
    store2.metadata.lastModified = '2023-01-02T00:00:00Z';

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test both merges in different orders
    const { store: storeA, doc: docA } = createParcelStore('TEST123');
    const { store: storeB, doc: docB } = createParcelStore('TEST123');

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both stores should converge to the same state
    expect(storeA.metadata.author).toBe(storeB.metadata.author);
    expect(storeA.metadata.lastModified).toBe(storeB.metadata.lastModified);
  });

  test('consistent merge with concurrent photo additions', () => {
    // Create two independent stores for the same parcel
    const { store: store1, doc: doc1 } = createParcelStore('TEST123');
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');

    // Add different photos to each store
    store1.photos.push({
      id: 'photo1',
      caption: 'Photo 1',
      uri: 'file:///photo1.jpg',
      timestamp: '2023-01-01T00:00:00Z'
    });

    store2.photos.push({
      id: 'photo2',
      caption: 'Photo 2',
      uri: 'file:///photo2.jpg',
      timestamp: '2023-01-02T00:00:00Z'
    });

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test both merges in different orders
    const { store: storeA, doc: docA } = createParcelStore('TEST123');
    const { store: storeB, doc: docB } = createParcelStore('TEST123');

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both stores should converge to the same state and contain both photos
    expect(storeA.photos.length).toBe(storeB.photos.length);
    expect(storeA.photos.length).toBe(2);
    
    const photoIdsA = storeA.photos.map(p => p.id).sort();
    const photoIdsB = storeB.photos.map(p => p.id).sort();
    
    expect(photoIdsA).toEqual(photoIdsB);
    expect(photoIdsA).toEqual(['photo1', 'photo2'].sort());
  });

  test('encode and decode preserves document state', () => {
    const { store, doc } = createParcelStore('TEST123');
    store.notes = 'Test content for encoding';
    store.metadata.author = 'Test Author';
    store.photos.push({
      id: 'test-photo',
      caption: 'Test Caption',
      uri: 'file:///test.jpg',
      timestamp: '2023-01-01T00:00:00Z'
    });
    
    // Encode the document
    const encoded = encodeDocUpdate(doc);
    expect(typeof encoded).toBe('string');
    
    // Create a new document and apply the update
    const { store: newStore, doc: newDoc } = createParcelStore('TEST123');
    applyEncodedUpdate(newDoc, encoded);
    
    // The new store should have the same content
    expect(newStore.notes).toBe('Test content for encoding');
    expect(newStore.metadata.author).toBe('Test Author');
    expect(newStore.photos.length).toBe(1);
    expect(newStore.photos[0].id).toBe('test-photo');
  });

  test('mergeUpdates correctly applies an update', () => {
    // Create initial doc with content
    const { store, doc } = createParcelStore('TEST123');
    store.notes = 'Initial content';
    
    // Create another doc with different content
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');
    store2.notes = 'Updated content';
    
    const update = encodeDocUpdate(doc2);
    
    // Merge the update into the first doc
    mergeUpdates(doc, update);
    
    // The first store should now have the merged content
    expect(store.notes).toBe('Updated content');
  });

  test('createSnapshot returns correct data', () => {
    const { store, doc } = createParcelStore('TEST123');
    store.notes = 'Snapshot test';
    store.metadata.author = 'Snapshot Author';
    store.photos.push({
      id: 'snapshot-photo',
      caption: 'Snapshot Caption',
      uri: 'file:///snapshot.jpg',
      timestamp: '2023-01-01T00:00:00Z'
    });
    
    const snapshot = createSnapshot(doc);
    
    expect(snapshot.notes).toBe('Snapshot test');
    expect(snapshot.metadata.author).toBe('Snapshot Author');
    expect(snapshot.photos.length).toBe(1);
    expect(snapshot.photos[0].id).toBe('snapshot-photo');
  });
});