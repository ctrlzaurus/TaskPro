import IconBtn from 'components/IconBtn/IconBtn';
import s from './BoardCard.module.scss';
import {
  deleteTaskById,
  updateTaskById,
  updateTaskColumnById,
} from 'redux/board/boardOperations';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import {
  selectBoards,
  selectFilter,
  selectTasks,
} from 'redux/board/boardSelectors';
import { formatDate } from 'services/dateChange';
import { getFormattedValue } from 'services/priorityChange';
import { findPriorityColor } from 'services/priorityOptions';
import Modal from 'components/Modal/Modal';
import EditCard from 'components/Forms/AddAndEditCard/EditCard/EditCard';
import Icon from 'components/Icon/Icon';
import { trimTitleString } from 'services/trimStr';
import clsx from 'clsx';
import ButtonDelete from 'components/Modal/ButtonDelete';

const BoardCard = ({ column }) => {
  const [redirectData, setRedirectData] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const dispatch = useDispatch();
  const wrapperRef = useRef(null);
  const allCards = useSelector(selectTasks);
  const allBoards = useSelector(selectBoards);
  const filter = useSelector(selectFilter);
  const [deleteModal, setDeleteModal] = useState(false);

  const handleDeleteModal = () => setDeleteModal(!deleteModal);

  const checkDate = date => {
    const currentDateTime = new Date();
    const deadlineDateTime = new Date(date);
    deadlineDateTime.setHours(0, 0, 0, 0);
    const currentDate = new Date(
      currentDateTime.getFullYear(),
      currentDateTime.getMonth(),
      currentDateTime.getDate()
    );

    return {
      isToday: currentDate.getTime() === deadlineDateTime.getTime(),
      isPast: currentDate > deadlineDateTime,
    };
  };

  const filteredCards = filter => {
    const result = allCards
      .filter(el => el.columnId === column._id)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (!filter) return result;

    return result.filter(el => el.priority === filter);
  };

  const hendleRedirectOpen = ({ columnId, boardId, cardId }) => {
    const allCurrentBoardColumns = allBoards.filter(
      ({ _id }) => _id === boardId
    )[0].columns;
    setCurrentCard(cardId);
    setRedirectData(
      allCurrentBoardColumns.filter(({ _id }) => _id !== columnId)
    );
  };

  const hendleRedirectClose = () => {
    setCurrentCard(null);
    setRedirectData(null);
  };

  const hendleRedirectClick = data => {
    dispatch(updateTaskColumnById(data));
    setCurrentCard(null);
    setRedirectData(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        hendleRedirectClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const [editCardModal, setEditCardModal] = useState(null);

  const handleCloseEditCardModal = () => setEditCardModal(null);
  const handleOpenEditCardModal = card => setEditCardModal({ ...card });

  const handleCardUpdate = async updatedCard => {
    try {
      await dispatch(updateTaskById({ id: updatedCard.id, data: updatedCard }));
      handleCloseEditCardModal();
    } catch (error) {
      console.log(error);
    }
  };

  const hendleDeleteClick = id => {
    dispatch(deleteTaskById(id));
  };

  return (
    <>
      <ul className={s.cardList}>
        {filteredCards(filter).map(card => (
          <li className={s.cardToDo} key={card._id}>
            <div
              style={{
                backgroundColor: findPriorityColor(card.priority),
              }}
              className={s.beforeColor}
            ></div>{' '}
            <h2 className={s.titleCard}>{trimTitleString(card.title, 25)}</h2>
            <p className={s.textCard}>{card.text}</p>
            <div className={s.line}></div>
            <div className={s.bottomMenuCard}>
              <div className={s.textBottomMenuCard}>
                <div>
                  <h3 className={s.titleBottomMenuCard}>Priority</h3>
                  <p className={s.discriptionBottomMenuCard}>
                    <span
                      style={{
                        backgroundColor: findPriorityColor(card.priority),
                      }}
                      className={s.priorityColor}
                    ></span>{' '}
                    {getFormattedValue(card.priority)}
                  </p>
                </div>
                <div>
                  <h3 className={s.titleBottomMenuCard}>Deadline</h3>
                  <p className={s.discriptionBottomMenuCard}>
                    {formatDate(card.deadline)}
                  </p>
                </div>
              </div>

              <div className={s.iconToDo}>
                {(checkDate(card.deadline).isToday ||
                  checkDate(card.deadline).isPast) && (
                  <Icon
                    name="icon-alarm"
                    width={16}
                    height={16}
                    secondaryClassName={clsx(
                      s.alarm,
                      checkDate(card.deadline).isPast && s.deadLineFailed
                    )}
                  />
                )}
                <IconBtn
                  name="icon-arrow"
                  width={16}
                  height={16}
                  onClick={() =>
                    hendleRedirectOpen({
                      columnId: card.columnId,
                      boardId: card.boardId,
                      cardId: card._id,
                    })
                  }
                />
                <IconBtn
                  name="icon-pencil"
                  width={16}
                  height={16}
                  secondaryClassName={s.iconPencil}
                  onClick={() => handleOpenEditCardModal(card)}
                />
                <IconBtn
                  name="icon-trash"
                  width={16}
                  height={16}
                  secondaryClassName={s.iconTrash}
                  onClick={handleDeleteModal}
                />
                {deleteModal && (
                  <Modal title="Are you sure ?" closeModal={handleDeleteModal}>
                    <ButtonDelete
                      onClick={() => {
                        hendleDeleteClick(card._id);
                        handleDeleteModal();
                      }}
                    />
                  </Modal>
                )}
                {redirectData && currentCard === card._id && (
                  <ul className={s.redirectList} ref={wrapperRef}>
                    {redirectData.map(column => (
                      <li
                        key={column._id}
                        className={s.redirectItem}
                        onClick={() =>
                          hendleRedirectClick({
                            idTask: card._id,
                            idColumn: column._id,
                          })
                        }
                      >
                        <p>{trimTitleString(column.title, 20)}</p>
                        <Icon
                          name="icon-arrow-redirect"
                          width={16}
                          height={16}
                          secondaryClassName={s.iconArrow}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {editCardModal && (
        <Modal title="Edit card" closeModal={handleCloseEditCardModal}>
          <EditCard
            closeModal={handleCloseEditCardModal}
            card={editCardModal}
            onUpdate={handleCardUpdate}
          />
        </Modal>
      )}
    </>
  );
};

export default BoardCard;
