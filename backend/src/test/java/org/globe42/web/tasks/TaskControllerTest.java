package org.globe42.web.tasks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.globe42.dao.PersonDao;
import org.globe42.dao.TaskDao;
import org.globe42.dao.UserDao;
import org.globe42.domain.Person;
import org.globe42.domain.Task;
import org.globe42.domain.TaskStatus;
import org.globe42.domain.User;
import org.globe42.test.Answers;
import org.globe42.test.BaseTest;
import org.globe42.web.exception.BadRequestException;
import org.globe42.web.exception.NotFoundException;
import org.globe42.web.security.CurrentUser;
import org.globe42.web.users.UserControllerTest;
import org.globe42.web.util.PageDTO;
import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

/**
 * Unit tests for {@link TaskController}
 * @author JB Nizet
 */
public class TaskControllerTest extends BaseTest {
    @Mock
    private TaskDao mockTaskDao;

    @Mock
    private UserDao mockUserDao;

    @Mock
    private PersonDao mockPersonDao;

    @Mock
    private CurrentUser mockCurrentUser;

    @InjectMocks
    private TaskController controller;

    private Task task1;
    private Task task2;
    private User user;

    @Before
    public void prepare() {
        user = UserControllerTest.createUser(1L);
        Person person = new Person(2L);

        task1 = createTask(23L, user, person);

        task2 = new Task(24L);
        task2.setStatus(TaskStatus.TODO);
        task2.setDescription("description2");
        task2.setTitle("title2");
    }

    @Test
    public void shouldListTodo() {
        PageRequest pageRequest = PageRequest.of(0, TaskController.PAGE_SIZE);
        when(mockTaskDao.findTodo(pageRequest)).thenReturn(singlePage(Arrays.asList(task1, task2), pageRequest));

        PageDTO<TaskDTO> result = controller.listTodo(Optional.empty());

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
        TaskDTO dto1 = result.getContent().get(0);
        assertThat(dto1.getStatus()).isEqualTo(task1.getStatus());
        assertThat(dto1.getDescription()).isEqualTo(task1.getDescription());
        assertThat(dto1.getTitle()).isEqualTo(task1.getTitle());
        assertThat(dto1.getDueDate()).isEqualTo(task1.getDueDate());
        assertThat(dto1.getCreator().getId()).isEqualTo(task1.getCreator().getId());
        assertThat(dto1.getAssignee().getId()).isEqualTo(task1.getAssignee().getId());
        assertThat(dto1.getConcernedPerson().getId()).isEqualTo(task1.getConcernedPerson().getId());
    }

    @Test
    public void shouldListUnassigned() {
        PageRequest pageRequest = PageRequest.of(0, TaskController.PAGE_SIZE);
        when(mockTaskDao.findTodoUnassigned(pageRequest)).thenReturn(singlePage(Arrays.asList(task1, task2), pageRequest));

        PageDTO<TaskDTO> result = controller.listUnassigned(Optional.empty());

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
    }

    @Test
    public void shouldListMine() {
        when(mockCurrentUser.getUserId()).thenReturn(user.getId());
        when(mockUserDao.getOne(user.getId())).thenReturn(user);

        PageRequest pageRequest = PageRequest.of(0, TaskController.PAGE_SIZE);
        when(mockTaskDao.findTodoByAssignee(user, pageRequest)).thenReturn(singlePage(Arrays.asList(task1, task2), pageRequest));

        PageDTO<TaskDTO> result = controller.listMine(Optional.empty());

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
    }

    @Test
    public void shouldListBefore() {
        LocalDate maxDate = LocalDate.of(2017, 8, 4);
        PageRequest pageRequest = PageRequest.of(0, TaskController.PAGE_SIZE);
        when(mockTaskDao.findTodoBefore(maxDate, pageRequest)).thenReturn(singlePage(Arrays.asList(task1, task2), pageRequest));

        PageDTO<TaskDTO> result = controller.listTodoBefore(maxDate, Optional.empty());

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
    }

    @Test
    public void shouldListForPerson() {
        Person person = new Person(42L);
        when(mockPersonDao.getOne(person.getId())).thenReturn(person);
        PageRequest pageRequest = PageRequest.of(0, TaskController.PAGE_SIZE);
        when(mockTaskDao.findTodoByConcernedPerson(person, pageRequest)).thenReturn(singlePage(Arrays.asList(task1, task2), pageRequest));

        PageDTO<TaskDTO> result = controller.listForPerson(person.getId(), Optional.empty());

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
    }

    @Test
    public void shouldListArchived() {
        PageRequest pageRequest = PageRequest.of(2, TaskController.PAGE_SIZE);
        when(mockTaskDao.findArchived(pageRequest)).thenReturn(
            new PageImpl<>(Arrays.asList(task1, task2), pageRequest, 42));

        PageDTO<TaskDTO> result = controller.listArchived(Optional.of(2));

        assertThat(result.getContent()).extracting(TaskDTO::getId).containsExactly(task1.getId(), task2.getId());
        assertThat(result.getNumber()).isEqualTo(2);
        assertThat(result.getSize()).isEqualTo(TaskController.PAGE_SIZE);
        assertThat(result.getTotalElements()).isEqualTo(42);
        assertThat(result.getTotalPages()).isEqualTo(3);
    }

    @Test
    public void shouldAssign() {
        when(mockTaskDao.findById(task2.getId())).thenReturn(Optional.of(task2));
        when(mockUserDao.findById(user.getId())).thenReturn(Optional.of(user));

        controller.assign(task2.getId(), new TaskAssignmentCommandDTO(user.getId()));

        assertThat(task2.getAssignee()).isEqualTo(user);
    }

    @Test(expected = NotFoundException.class)
    public void shouldThrowWhenAssigningUnexistingTask() {
        when(mockTaskDao.findById(task2.getId())).thenReturn(Optional.empty());
        when(mockUserDao.findById(user.getId())).thenReturn(Optional.of(user));

        controller.assign(task2.getId(), new TaskAssignmentCommandDTO(user.getId()));
    }

    @Test(expected = BadRequestException.class)
    public void shouldThrowWhenAssigningToUnexistingUser() {
        when(mockTaskDao.findById(task2.getId())).thenReturn(Optional.of(task2));
        when(mockUserDao.findById(user.getId())).thenReturn(Optional.empty());

        controller.assign(task2.getId(), new TaskAssignmentCommandDTO(user.getId()));
    }

    @Test
    public void shouldUnassign() {
        when(mockTaskDao.findById(task2.getId())).thenReturn(Optional.of(task2));

        controller.unassign(task2.getId());

        assertThat(task2.getAssignee()).isEqualTo(null);
    }

    @Test(expected = NotFoundException.class)
    public void shouldThrowWhenUnassigningUnexistingTask() {
        when(mockTaskDao.findById(task2.getId())).thenReturn(Optional.empty());

        controller.unassign(task2.getId());
    }

    @Test
    public void shouldChangeStatus() {
        when(mockTaskDao.findById(task1.getId())).thenReturn(Optional.of(task1));

        controller.changeStatus(task1.getId(), new TaskStatusChangeCommandDTO(TaskStatus.DONE));

        assertThat(task1.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(task1.getArchivalInstant()).isNotNull();
    }

    @Test(expected = NotFoundException.class)
    public void shouldThrowWhenChangingStatusOfUnexistingTask() {
        when(mockTaskDao.findById(task1.getId())).thenReturn(Optional.empty());

        controller.changeStatus(task1.getId(), new TaskStatusChangeCommandDTO(TaskStatus.DONE));
    }

    @Test
    public void shouldGet() {
        when(mockTaskDao.findById(task1.getId())).thenReturn(Optional.of(task1));

        TaskDTO result = controller.get(task1.getId());

        assertThat(result.getId()).isEqualTo(task1.getId());
    }

    @Test(expected = NotFoundException.class)
    public void shouldThrowWhenGettingUnexistingTask() {
        when(mockTaskDao.findById(task1.getId())).thenReturn(Optional.empty());
        controller.get(task1.getId());
    }

    @Test
    public void shouldCreate() {
        TaskCommandDTO command = createCommand(12L, 13L);

        Person person = new Person(command.getConcernedPersonId());
        when(mockPersonDao.findById(person.getId())).thenReturn(Optional.of(person));

        User user = new User(command.getAssigneeId());
        when(mockUserDao.findById(user.getId())).thenReturn(Optional.of(user));

        when(mockTaskDao.save(any(Task.class))).thenAnswer(Answers.<Task>modifiedFirstArgument(task -> task.setId(42L)));

        TaskDTO result = controller.create(command);
        assertThat(result.getId()).isEqualTo(42L);
        assertThat(result.getTitle()).isEqualTo(command.getTitle());
        assertThat(result.getDescription()).isEqualTo(command.getDescription());
        assertThat(result.getDueDate()).isEqualTo(command.getDueDate());
        assertThat(result.getConcernedPerson().getId()).isEqualTo(person.getId());
        assertThat(result.getAssignee().getId()).isEqualTo(user.getId());
    }

    @Test
    public void shouldCreateWhenNullReferencesPassedInCommand() {
        TaskCommandDTO command = createCommand(null, null);

        when(mockTaskDao.save(any(Task.class))).thenAnswer(Answers.<Task>modifiedFirstArgument(task -> task.setId(42L)));

        TaskDTO result = controller.create(command);
        assertThat(result.getConcernedPerson()).isNull();
        assertThat(result.getAssignee()).isNull();
    }

    @Test
    public void shouldUpdate() {
        TaskCommandDTO command = createCommand(12L, 13L);

        Person person = new Person(command.getConcernedPersonId());
        when(mockPersonDao.findById(person.getId())).thenReturn(Optional.of(person));

        User user = new User(command.getAssigneeId());
        when(mockUserDao.findById(user.getId())).thenReturn(Optional.of(user));

        when(mockTaskDao.findById(task1.getId())).thenReturn(Optional.of(task1));

        controller.update(task1.getId(), command);

        assertThat(task1.getTitle()).isEqualTo(command.getTitle());
        assertThat(task1.getDescription()).isEqualTo(command.getDescription());
        assertThat(task1.getDueDate()).isEqualTo(command.getDueDate());
        assertThat(task1.getConcernedPerson().getId()).isEqualTo(person.getId());
        assertThat(task1.getAssignee().getId()).isEqualTo(user.getId());
    }

    static Task createTask(Long id, User user, Person person) {
        Task task = new Task(id);
        task.setStatus(TaskStatus.TODO);
        task.setDescription("description");
        task.setTitle("title");
        task.setDueDate(LocalDate.of(2017, 8, 1));
        task.setAssignee(user);
        task.setCreator(user);
        task.setConcernedPerson(person);

        return task;
    }

    static TaskCommandDTO createCommand(Long concernedPersonId, Long assigneeId) {
        return new TaskCommandDTO("new title",
                                  "new description",
                                  LocalDate.now().plusDays(1),
                                  concernedPersonId,
                                  assigneeId);
    }

    private Page<Task> singlePage(List<Task> tasks, PageRequest pageRequest) {
        return new PageImpl<>(tasks, pageRequest, tasks.size());
    }
}