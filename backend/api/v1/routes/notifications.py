from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from infrastructure.database.connection import get_db
from infrastructure.database.models import Notification, User as UserModel
from api.v1.auth.deps import get_current_user

router = APIRouter()

@router.get("")
async def get_notifications(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách thông báo của người dùng hiện tại"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifications

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu một thông báo là đã đọc"""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu tất cả thông báo là đã đọc"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"message": "All marked as read"}
