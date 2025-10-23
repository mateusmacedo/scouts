import { UserEntity } from './user.entity';

describe('UserEntity', () => {
        it('deve higienizar dados ao criar novo usuário', () => {
                const baseDate = new Date(Date.UTC(2024, 0, 1));
                const entity = UserEntity.create(
                        {
                                name: '  João   Silva  ',
                                email: '  joao@scouts.com  ',
                                phone: ' +5511999999999 ',
                        },
                        {
                                id: 'user-entity-1',
                                now: baseDate,
                        }
                );

                expect(entity.id).toBe('user-entity-1');
                expect(entity.name).toBe('João Silva');
                expect(entity.email).toBe('joao@scouts.com');
                expect(entity.phone).toBe('+5511999999999');
                expect(entity.createdAt.getTime()).toBe(baseDate.getTime());
                expect(entity.createdAt).not.toBe(baseDate);
        });

        it('deve atualizar dados preservando telefone quando indefinido', () => {
                const entity = UserEntity.create(
                        {
                                name: 'Usuário',
                                email: 'user@scouts.com',
                                phone: '+5511987654321',
                        },
                        {
                                id: 'user-entity-2',
                                now: new Date(Date.UTC(2024, 0, 1)),
                        }
                );

                const updated = entity.update(
                        {
                                email: 'novo@scouts.com',
                                phone: '+5511976543210',
                        },
                        new Date(Date.UTC(2024, 1, 1))
                );

                expect(updated.email).toBe('novo@scouts.com');
                expect(updated.phone).toBe('+5511976543210');

                const withoutPhoneUpdate = updated.update(
                        {
                                name: 'Usuário Sem Telefone',
                        },
                        new Date(Date.UTC(2024, 2, 1))
                );

                expect(withoutPhoneUpdate.phone).toBe('+5511976543210');

                const removedPhone = withoutPhoneUpdate.update(
                        {
                                phone: null,
                        },
                        new Date(Date.UTC(2024, 3, 1))
                );

                expect(removedPhone.phone).toBeNull();
        });

        it('deve restaurar instância e expor getters clonados', () => {
                const restored = UserEntity.restore({
                        id: 'user-entity-3',
                        name: '  Maria  Souza  ',
                        email: 'maria@scouts.com ',
                        phone: null,
                        createdAt: new Date(Date.UTC(2024, 0, 10)),
                        updatedAt: new Date(Date.UTC(2024, 0, 15)),
                });

                expect(restored.id).toBe('user-entity-3');
                expect(restored.name).toBe('Maria Souza');
                expect(restored.email).toBe('maria@scouts.com');
                expect(restored.phone).toBeNull();

                const createdAt = restored.createdAt;
                const updatedAt = restored.updatedAt;

                expect(createdAt).toBeInstanceOf(Date);
                expect(updatedAt).toBeInstanceOf(Date);

                const clone = restored.clone();
                expect(clone).not.toBe(restored);
                expect(clone.toJSON().createdAt).toBeInstanceOf(Date);
        });
});
