'use strict';

class ToDoList {
  constructor(name) {
    this._init(name);
    this._initEvents(
      document.querySelector('#enter'),
      document.querySelector('#userinput'),
      document.querySelector('ul'),
    );
  }

  async add(text, priority = 1) {
    try {
      const task = {
        value: text,
        priority: priority,
      };

      const request = this._createRequest('POST', task, this._authorization);

      const newTask = await this._getJSON(
        'https://todo.hillel.it/todo',
        request,
      );
      this._storage.push(newTask);

      return newTask;
    } catch (err) {
      console.error(err);
    }
  }

  async edit(id, text, priority = 1) {
    try {
      const index = this._findIndex(id);
      if (index !== -1) {
        const task = {
          value: text,
          priority: priority,
        };

        const request = this._createRequest('PUT', task, this._authorization);

        await this._getJSON('https://todo.hillel.it/todo', request, id);
        this._storage[index] = await this._getTask(id);
      } else {
        throw new Error('False index');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async complete(id) {
    try {
      const index = this._findIndex(id);
      if (index !== -1) {
        const request = this._createRequest('PUT', null, this._authorization);

        await this._getJSON('https://todo.hillel.it/todo', request, id, true);
        this._storage[index] = await this._getTask(id);
      } else {
        throw new Error('False index');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async delete(id) {
    try {
      const index = this._findIndex(id);
      if (index !== -1) {
        const request = this._createRequest(
          'DELETE',
          null,
          this._authorization,
        );

        await this._getJSON('https://todo.hillel.it/todo', request, id);
        this._storage.splice(index, 1);
      } else {
        throw new Error('False index');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async _init(name) {
    this.name = {
      value: name,
    };
    this._authorization = {
      Authorization: 'Bearer ' + (await this._getToken()).access_token,
    };
    this._storage = await this._getList();
  }

  async _getJSON(url, request, id = null, toggle = false) {
    return fetch(
      id === null
        ? url
        : toggle === false
        ? url + `/${id}`
        : url + `/${id}/toggle`,
      request,
    ).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    });
  }

  _createRequest(method, data, headers) {
    if (!data && !headers) {
      return {
        method: method,
        headers: {
          'content-type': 'application/json',
        },
      };
    } else if (!data) {
      return {
        method: method,
        headers: {
          'content-type': 'application/json',
          ...headers,
        },
      };
    } else if (!headers) {
      return {
        method: method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      };
    } else {
      return {
        method: method,
        headers: {
          'content-type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      };
    }
  }

  async _getToken() {
    return this._getJSON(
      'https://todo.hillel.it/auth/login',
      this._createRequest('POST', this.name),
    );
  }

  async _getList() {
    const listRequest = this._createRequest('GET', null, this._authorization);

    const list = await this._getJSON(
      'https://todo.hillel.it/todo',
      listRequest,
    );

    list.map(el => this._createListElement(el));

    return list;
  }

  async _getTask(id) {
    const request = this._createRequest('GET', null, this._authorization);

    return await this._getJSON('https://todo.hillel.it/todo', request, id);
  }

  _findIndex(id) {
    return this._storage.findIndex(task => task._id === id);
  }

  _initEvents(button, input, ul) {
    button.addEventListener('click', () => {
      if (input.value.length > 0) {
        this._createListElement(input);
      }
    });

    input.addEventListener('keypress', event => {
      if (input.value.length > 0 && event.code === 'Enter') {
        this._createListElement(input);
      }
    });

    ul.addEventListener('click', event => {
      const note = event.target.parentElement;
      const input = note.children[3];
      const editOkButton = note.children[4];

      if (event.target.className === 'edit') {
        input.classList.remove('hidden');
        editOkButton.classList.remove('hidden');
      }

      if (event.target.className === 'input_ok') {
        const newText = input.value;
        note.childNodes[0].textContent = newText;
        this.edit(+note.id, newText);

        input.classList.add('hidden');
        editOkButton.classList.add('hidden');
      }

      if (event.target.className === 'complete') {
        note.classList.toggle('done');
        this.complete(+note.id);
      }

      if (event.target.className === 'delete') {
        note.remove();
        this.delete(+note.id);
      }
    });
  }

  async _createListElement(input) {
    const editButton = document.createElement('button');
    editButton.append(document.createTextNode('edit'));
    editButton.classList.add('edit');

    const completeButton = document.createElement('button');
    completeButton.append(document.createTextNode('complete'));
    completeButton.classList.add('complete');

    const deleteButton = document.createElement('button');
    deleteButton.append(document.createTextNode('delete'));
    deleteButton.classList.add('delete');

    const inputField = document.createElement('input');
    inputField.setAttribute('type', 'text');
    inputField.classList.add('hidden');

    const inputButton = document.createElement('button');
    inputButton.append(document.createTextNode('ok'));
    inputButton.classList.add('hidden', 'input_ok');

    const li = document.createElement('li');
    li.append(document.createTextNode(input.value));
    li.append(editButton);
    li.append(completeButton);
    li.append(deleteButton);
    li.append(inputField);
    li.append(inputButton);

    const ul = document.querySelector('ul');
    ul.append(li);

    if (input.value && this._storage) {
      const inputValue = await this.add(input.value);
      li.setAttribute('id', await inputValue._id);
    } else {
      li.setAttribute('id', input._id);
    }

    input.value = '';
  }
}

const toDoList = new ToDoList('New List');
