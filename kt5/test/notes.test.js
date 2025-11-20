const request = require('supertest');
const app = require('../server');
const Note = require('../models/Note');

describe('Notes API', () => {
  describe('GET /notes', () => {
    test('should return 200 with all notes', async () => {
      // Создаем тестовые заметки
      const note1 = new Note({ title: 'Test Note 1', content: 'Content 1' });
      const note2 = new Note({ title: 'Test Note 2', content: 'Content 2' });
      await note1.save();
      await note2.save();

      const response = await request(app)
        .get('/notes')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('created');
      expect(response.body[0]).toHaveProperty('changed');
    });

    test('should return 404 when no notes exist', async () => {
      const response = await request(app)
        .get('/notes')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /note/:id', () => {
    test('should return 200 with note by id', async () => {
      const note = new Note({ title: 'Test Note', content: 'Test Content' });
      const savedNote = await note.save();

      const response = await request(app)
        .get(`/note/${savedNote._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Test Note');
      expect(response.body.content).toBe('Test Content');
    });

    test('should return 404 when note not found', async () => {
      const fakeId = new require('mongoose').Types.ObjectId();
      const response = await request(app)
        .get(`/note/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for invalid id format', async () => {
      const response = await request(app)
        .get('/note/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /note/read/:title', () => {
    test('should return 200 with note by title', async () => {
      const note = new Note({ title: 'Unique Title', content: 'Test Content' });
      await note.save();

      const response = await request(app)
        .get('/note/read/Unique Title')
        .expect(200);

      expect(response.body.title).toBe('Unique Title');
      expect(response.body.content).toBe('Test Content');
    });

    test('should return 404 when note with title not found', async () => {
      const response = await request(app)
        .get('/note/read/NonExistentTitle')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /note/', () => {
    test('should return 201 and create a new note', async () => {
      const newNote = {
        title: 'New Note',
        content: 'New Content'
      };

      const response = await request(app)
        .post('/note/')
        .send(newNote)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('New Note');
      expect(response.body.content).toBe('New Content');
      expect(response.body).toHaveProperty('created');
      expect(response.body).toHaveProperty('changed');
      expect(new Date(response.body.created)).toBeInstanceOf(Date);
      expect(new Date(response.body.changed)).toBeInstanceOf(Date);
    });

    test('should return 409 when note with same title exists', async () => {
      const note = new Note({ title: 'Duplicate Title', content: 'Content' });
      await note.save();

      const response = await request(app)
        .post('/note/')
        .send({ title: 'Duplicate Title', content: 'Different Content' })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    test('should set created and changed to same value on creation', async () => {
      const newNote = {
        title: 'Time Test Note',
        content: 'Content'
      };

      const response = await request(app)
        .post('/note/')
        .send(newNote)
        .expect(201);

      const created = new Date(response.body.created).getTime();
      const changed = new Date(response.body.changed).getTime();
      // Разница должна быть минимальной (в пределах секунды)
      expect(Math.abs(created - changed)).toBeLessThan(1000);
    });
  });

  describe('DELETE /note/:id', () => {
    test('should return 204 and delete note', async () => {
      const note = new Note({ title: 'To Delete', content: 'Content' });
      const savedNote = await note.save();

      await request(app)
        .delete(`/note/${savedNote._id}`)
        .expect(204);

      // Проверяем, что заметка удалена
      const deletedNote = await Note.findById(savedNote._id);
      expect(deletedNote).toBeNull();
    });

    test('should return 409 when note not found', async () => {
      const fakeId = new require('mongoose').Types.ObjectId();
      const response = await request(app)
        .delete(`/note/${fakeId}`)
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 409 for invalid id format', async () => {
      const response = await request(app)
        .delete('/note/invalid-id')
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /note/:id', () => {
    test('should return 204 and update note', async () => {
      const note = new Note({ title: 'Original Title', content: 'Original Content' });
      const savedNote = await note.save();
      const originalChanged = savedNote.changed;

      // Ждем немного, чтобы changed точно изменился
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .put(`/note/${savedNote._id}`)
        .send({ title: 'Updated Title', content: 'Updated Content' })
        .expect(204);

      // Проверяем обновление
      const updatedNote = await Note.findById(savedNote._id);
      expect(updatedNote.title).toBe('Updated Title');
      expect(updatedNote.content).toBe('Updated Content');
      expect(new Date(updatedNote.changed).getTime()).toBeGreaterThan(
        new Date(originalChanged).getTime()
      );
    });

    test('should update only title', async () => {
      const note = new Note({ title: 'Title', content: 'Content' });
      const savedNote = await note.save();

      await request(app)
        .put(`/note/${savedNote._id}`)
        .send({ title: 'New Title' })
        .expect(204);

      const updatedNote = await Note.findById(savedNote._id);
      expect(updatedNote.title).toBe('New Title');
      expect(updatedNote.content).toBe('Content');
    });

    test('should update only content', async () => {
      const note = new Note({ title: 'Title', content: 'Content' });
      const savedNote = await note.save();

      await request(app)
        .put(`/note/${savedNote._id}`)
        .send({ content: 'New Content' })
        .expect(204);

      const updatedNote = await Note.findById(savedNote._id);
      expect(updatedNote.title).toBe('Title');
      expect(updatedNote.content).toBe('New Content');
    });

    test('should return 409 when note not found', async () => {
      const fakeId = new require('mongoose').Types.ObjectId();
      const response = await request(app)
        .put(`/note/${fakeId}`)
        .send({ title: 'New Title' })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 409 when updating to duplicate title', async () => {
      const note1 = new Note({ title: 'Title 1', content: 'Content 1' });
      const note2 = new Note({ title: 'Title 2', content: 'Content 2' });
      const savedNote1 = await note1.save();
      await note2.save();

      const response = await request(app)
        .put(`/note/${savedNote1._id}`)
        .send({ title: 'Title 2' })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    test('should update changed field automatically', async () => {
      const note = new Note({ title: 'Title', content: 'Content' });
      const savedNote = await note.save();
      const originalChanged = savedNote.changed;

      await new Promise(resolve => setTimeout(resolve, 1000));

      await request(app)
        .put(`/note/${savedNote._id}`)
        .send({ content: 'Updated Content' })
        .expect(204);

      const updatedNote = await Note.findById(savedNote._id);
      expect(new Date(updatedNote.changed).getTime()).toBeGreaterThan(
        new Date(originalChanged).getTime()
      );
    });
  });
});

