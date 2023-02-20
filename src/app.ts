// сразу даем тип для id (он используется как в todo, так и в user)
type ID = string | number;

// интерфейс для todo-шек
interface Todo {
  userId: ID;
  id: ID;
  title: string;
  completed: boolean;
}

// интерфейс для юзеров
interface User {
  id: ID;
  name: string;
}

(function () {
  // Globals
  const todoList = document.getElementById("todo-list");
  const userSelect = document.getElementById("user-todo");
  const form = document.querySelector("form");
  // определяем тип для массива todo-шек
  let todos: Todo[] = [];
  // определяем тип для массива юзеров
  let users: User[] = [];

  // Attach Events
  document.addEventListener("DOMContentLoaded", initApp);
  // если форма существует - добавляем прослушиватель событий
  form?.addEventListener("submit", handleSubmit);

  // Basic Logic
  function getUserName(userId: ID) {
    const user = users.find((u) => u.id === userId);
    // если в итоге юзер есть - берем его имя
    return user?.name || "нет юзера";
  }
  // даем тип для todo-шки при получении аргументов функции
  function printTodo({ id, userId, title, completed }: Todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    // говорим, что id будет типом string, поскольку в dataSet может быть только string
    li.dataset.id = String(id);
    li.innerHTML = `<span>${title} <i>by</i> <b>${getUserName(
      userId
    )}</b></span>`;

    const status = document.createElement("input");
    status.type = "checkbox";
    status.checked = completed;
    status.addEventListener("change", handleTodoChange);

    const close = document.createElement("span");
    close.innerHTML = "&times;";
    close.className = "close";
    close.addEventListener("click", handleClose);

    li.prepend(status);
    li.append(close);

    todoList?.prepend(li);
  }

  function createUserOption(user: User) {
    // если юзер выбран
    if (userSelect) {
      const option = document.createElement("option");
      option.value = String(user.id);
      option.innerText = user.name;

      userSelect?.append(option);
    }
  }

  function removeTodo(todoId: ID) {
    if (todoList) {
      todos = todos.filter((todo) => todo.id !== todoId);

      const todo = todoList?.querySelector(`[data-id="${todoId}"]`);
      if (todo) {
        // если есть элементы input и close
        todo
          .querySelector("input")
          ?.removeEventListener("change", handleTodoChange);
        todo.querySelector(".close")?.removeEventListener("click", handleClose);

        todo.remove();
      }
    }
  }

  function alertError(error: Error) {
    alert(error.message);
  }

  // Event Logic
  function initApp() {
    Promise.all([getAllTodos(), getAllUsers()]).then((values) => {
      // при получении массивов юзеров и тудушек, даже если будет ошибка
      // typescript определяет типы корректно
      [todos, users] = values;

      // Отправить в разметку
      todos.forEach((todo) => printTodo(todo));
      users.forEach((user) => createUserOption(user));
    });
  }
  // используем глобальный тип Event
  function handleSubmit(event: Event) {
    event.preventDefault();

    // если форма вообще есть - создаем todo
    if (form) {
      createTodo({
        userId: Number(form.user.value),
        title: form.todo.value,
        completed: false,
      });
    }
  }

  // используем глобальный тип HTML и выбираем InputElement
  function handleTodoChange(this: HTMLInputElement) {
    const parent = this.parentElement;
    // если есть родительский элемент
    if (parent) {
      const todoId = this.parentElement?.dataset.id;
      const completed = this.checked;

      todoId && toggleTodoComplete(todoId, completed);
    }
  }
  function handleClose(this: HTMLSpanElement) {
    const parent = this.parentElement;
    if (parent) {
      const todoId = this.parentElement?.dataset.id;
      todoId && deleteTodo(todoId);
    }
  }

  // Async logic
  async function getAllTodos(): Promise<Todo[]> {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos?_limit=15"
      );
      const data = await response.json();

      return data;
    } catch (error) {
      // если ошибка является типом глобального объекта Error
      if (error instanceof Error) alertError(error);

      // в случае ошибки возвращаем пустой массив
      return [];
    }
  }

  async function getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/users?_limit=5"
      );
      const data = await response.json();

      return data;
    } catch (error) {
      if (error instanceof Error) {
        alertError(error);
      }
      // в случае ошибки - возвращаем пустой массив
      return [];
    }
  }

  // выбрасываем из нашего интерфейса Todo ключ id, поскольку он задается автоматически при создании todo-шки
  async function createTodo(todo: Omit<Todo, "id">) {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos",
        {
          method: "POST",
          body: JSON.stringify(todo),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newTodo = await response.json();

      printTodo(newTodo);
    } catch (error) {
      if (error instanceof Error) {
        alertError(error);
      }
    }
  }

  // задаем тип для аргументов
  async function toggleTodoComplete(todoId: ID, completed: boolean) {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${todoId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ completed }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to connect with the server! Please try later.");
      }
    } catch (error) {
      // если ошибка является типом глобального объекта Error
      if (error instanceof Error) {
        alertError(error);
      }
    }
  }

  async function deleteTodo(todoId: ID) {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${todoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        removeTodo(todoId);
      } else {
        throw new Error("Failed to connect with the server! Please try later.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alertError(error);
      }
    }
  }
})();
