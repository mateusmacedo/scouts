package user

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strconv"
	"time"
)

// EventType representa o tipo de evento publicado pelo serviço.
type EventType string

const (
	// EventUserCreated é emitido após criação bem-sucedida.
	EventUserCreated EventType = "user.created"
	// EventUserUpdated é emitido após atualização bem-sucedida.
	EventUserUpdated EventType = "user.updated"
	// EventUserDeleted é emitido após exclusão bem-sucedida.
	EventUserDeleted EventType = "user.deleted"
)

// Event encapsula informações de eventos emitidos para consumidores externos.
type Event struct {
	Type      EventType
	User      User
	Timestamp time.Time
}

// ErrNoUpdateData é retornado quando nenhuma alteração é informada.
var ErrNoUpdateData = errors.New("no update data provided")

// Service agrega regras de negócio sobre o repositório de usuários.
type Service struct {
	repository  UserRepository
	events      chan<- Event
	idGenerator func() string
	now         func() time.Time
}

// ServiceOption permite configurar parâmetros opcionais do serviço.
type ServiceOption func(*Service)

// WithIDGenerator configura um gerador de IDs customizado.
func WithIDGenerator(generator func() string) ServiceOption {
	return func(s *Service) {
		if generator != nil {
			s.idGenerator = generator
		}
	}
}

// WithNowProvider configura uma fonte de tempo customizada.
func WithNowProvider(provider func() time.Time) ServiceOption {
	return func(s *Service) {
		if provider != nil {
			s.now = provider
		}
	}
}

// NewService instancia um novo serviço com as dependências informadas.
func NewService(repository UserRepository, events chan<- Event, options ...ServiceOption) *Service {
	svc := &Service{
		repository:  repository,
		events:      events,
		idGenerator: defaultIDGenerator,
		now:         time.Now,
	}

	for _, option := range options {
		option(svc)
	}

	return svc
}

// CreateUser valida os dados, persiste o usuário e publica o evento correspondente.
func (s *Service) CreateUser(ctx context.Context, data CreateUserData) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	name, err := ValidateName(data.Name)
	if err != nil {
		return User{}, err
	}

	email, err := ValidateEmail(data.Email)
	if err != nil {
		return User{}, err
	}

	phone, err := ValidatePhone(data.Phone)
	if err != nil {
		return User{}, err
	}

	now := s.now().UTC()
	user := NewUser(s.idGenerator(), CreateUserData{
		Name:  name,
		Email: email,
		Phone: phone,
	}, now)

	created, err := s.repository.Create(ctx, user)
	if err != nil {
		return User{}, err
	}

	s.emitEvent(ctx, Event{Type: EventUserCreated, User: created.Clone(), Timestamp: now})
	return created, nil
}

// GetUser obtém um usuário pelo identificador.
func (s *Service) GetUser(ctx context.Context, id string) (User, error) {
	return s.repository.GetByID(ctx, id)
}

// ListUsers retorna todos os usuários presentes no repositório.
func (s *Service) ListUsers(ctx context.Context) ([]User, error) {
	return s.repository.List(ctx)
}

// UpdateUser aplica alterações sobre um usuário existente.
func (s *Service) UpdateUser(ctx context.Context, id string, data UpdateUserData) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	if data.IsEmpty() {
		return User{}, ErrNoUpdateData
	}

	existing, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return User{}, err
	}

	sanitized := UpdateUserData{}

	if data.Name != nil {
		name, err := ValidateName(*data.Name)
		if err != nil {
			return User{}, err
		}
		sanitizedName := name
		sanitized.Name = &sanitizedName
	}

	if data.Email != nil {
		email, err := ValidateEmail(*data.Email)
		if err != nil {
			return User{}, err
		}
		sanitizedEmail := email
		sanitized.Email = &sanitizedEmail
	}

	if data.Phone != nil {
		phone, err := ValidatePhone(*data.Phone)
		if err != nil {
			return User{}, err
		}
		sanitizedPhone := phone
		sanitized.Phone = &sanitizedPhone
	}

	now := s.now().UTC()
	existing.ApplyUpdate(sanitized, now)

	updated, err := s.repository.Update(ctx, existing)
	if err != nil {
		return User{}, err
	}

	s.emitEvent(ctx, Event{Type: EventUserUpdated, User: updated.Clone(), Timestamp: now})
	return updated, nil
}

// DeleteUser remove o usuário do repositório e emite o evento correspondente.
func (s *Service) DeleteUser(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	user, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.repository.Delete(ctx, id); err != nil {
		return err
	}

	s.emitEvent(ctx, Event{Type: EventUserDeleted, User: user.Clone(), Timestamp: s.now().UTC()})
	return nil
}

func (s *Service) emitEvent(ctx context.Context, event Event) {
	if s.events == nil {
		return
	}

	select {
	case s.events <- event:
	case <-ctx.Done():
	}
}

func defaultIDGenerator() string {
	var buffer [16]byte
	if _, err := rand.Read(buffer[:]); err == nil {
		return hex.EncodeToString(buffer[:])
	}

	return strconv.FormatInt(time.Now().UnixNano(), 36)
}
